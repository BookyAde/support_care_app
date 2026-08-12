import uuid
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_client
from app.core.rate_limit import limiter
from app.models.care_request import CareRequest
from app.models.enums import CareRequestStatus
from app.services.client_auth_service import create_client_with_credentials
from app.services.email_service import send_care_request_declined_email
from app.services.audit_service import log_action
from app.schemas.care_request import (
    CareRequestCreate,
    CareRequestMineCreate,
    CareRequestDeclineRequest,
    CareRequestResponse,
    CareRequestAcceptResponse,
)

router = APIRouter(prefix="/care-requests", tags=["care-requests"])


@router.post("", response_model=CareRequestResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def submit_care_request(request: Request, payload: CareRequestCreate, db: Session = Depends(get_db)):
    """
    PUBLIC endpoint - no auth, anyone on the marketing site can submit this.
    `honeypot` is a hidden form field real visitors never see or fill in; if a
    bot fills it in, we return a normal-looking 201 without saving anything, so
    the bot gets no signal that its submission was actually rejected. Rate-
    limited (3/minute/IP) since this is public and unauthenticated.
    """
    if payload.honeypot:
        fake = CareRequest(
            id=uuid.uuid4(),
            requester_name=payload.requester_name,
            requester_relationship=payload.requester_relationship,
            requester_phone=payload.requester_phone,
            requester_email=payload.requester_email,
            care_recipient_name=payload.care_recipient_name,
            care_recipient_address=payload.care_recipient_address,
            care_type_summary=payload.care_type_summary,
            additional_notes=payload.additional_notes,
            frequency=payload.frequency,
            is_urgent=payload.is_urgent,
            status=CareRequestStatus.PENDING,
            created_at=datetime.now(timezone.utc),
        )
        return fake  # never added to the session - nothing is persisted

    care_request = CareRequest(
        requester_name=payload.requester_name,
        requester_relationship=payload.requester_relationship,
        requester_phone=payload.requester_phone,
        requester_email=payload.requester_email,
        care_recipient_name=payload.care_recipient_name,
        care_recipient_address=payload.care_recipient_address,
        care_type_summary=payload.care_type_summary,
        additional_notes=payload.additional_notes,
        frequency=payload.frequency,
        is_urgent=payload.is_urgent,
    )
    db.add(care_request)
    db.commit()
    db.refresh(care_request)
    return care_request


@router.post("/mine", response_model=CareRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_care_request_as_client(
    payload: CareRequestMineCreate, client=Depends(get_current_client), db: Session = Depends(get_db)
):
    """
    Same submission as the public form, but from inside an already-authenticated
    client's own dashboard - requester/recipient details are auto-filled from
    their own record instead of typed in, and existing_client_id marks this
    request as belonging to a real client so accept() knows not to create a
    duplicate one.
    """
    if not client.email:
        # requester_email is NOT NULL on care_requests, but Client.email is
        # optional (access_code is the primary login, email is opt-in) - a
        # client without one on file can't submit this way without a clean
        # error explaining why, rather than a raw DB constraint failure.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add an email to your account before submitting a care request.",
        )

    care_request = CareRequest(
        requester_name=client.full_name,
        requester_relationship="Existing client",
        requester_phone=client.contact_number,
        requester_email=client.email,
        care_recipient_name=client.full_name,
        care_recipient_address=client.address,
        care_type_summary=payload.care_type_summary,
        additional_notes=payload.additional_notes,
        frequency=payload.frequency,
        is_urgent=payload.is_urgent,
        existing_client_id=client.id,
    )
    db.add(care_request)
    db.commit()
    db.refresh(care_request)
    return care_request


@router.get("/mine", response_model=list[CareRequestResponse])
def list_my_care_requests(client=Depends(get_current_client), db: Session = Depends(get_db)):
    return (
        db.query(CareRequest)
        .filter(CareRequest.existing_client_id == client.id)
        .order_by(CareRequest.created_at.desc())
        .all()
    )


@router.get("", response_model=list[CareRequestResponse])
def list_care_requests(
    status_filter: CareRequestStatus | None = Query(None, alias="status"),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(CareRequest)
    if status_filter:
        query = query.filter(CareRequest.status == status_filter)
    return query.order_by(CareRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=CareRequestResponse)
def get_care_request(request_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    care_request = db.query(CareRequest).filter(CareRequest.id == request_id).first()
    if not care_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care request not found")
    return care_request


@router.post("/{request_id}/accept", response_model=CareRequestAcceptResponse)
def accept_care_request(request_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    care_request = db.query(CareRequest).filter(CareRequest.id == request_id).first()
    if not care_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care request not found")
    if care_request.status != CareRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This request has already been reviewed")

    if care_request.existing_client_id is not None:
        # This request came from a client who already has an account (POST
        # /care-requests/mine) - create_client_with_credentials() must NOT run
        # here, or every acceptance would spin up a duplicate client record.
        care_request.status = CareRequestStatus.ACCEPTED
        care_request.reviewed_by_admin_id = admin.id
        care_request.reviewed_at = datetime.now(timezone.utc)

        log_action(
            db, admin.id, "admin", "care_request_accepted", "care_request", care_request.id,
            details={"existing_client_id": str(care_request.existing_client_id)},
        )
        db.commit()
        db.refresh(care_request)

        return CareRequestAcceptResponse(
            care_request=care_request,
            needs_manual_followup=True,
            message="This is an existing client. Update their care plan directly on their client record.",
        )

    client, temp_password, email_sent = create_client_with_credentials(
        db,
        full_name=care_request.care_recipient_name,
        address=care_request.care_recipient_address,
        contact_number=care_request.requester_phone,
        emergency_contact=f"{care_request.requester_name} ({care_request.requester_relationship}) - {care_request.requester_phone}",
        care_plan=care_request.care_type_summary,
        special_instructions=care_request.additional_notes,
        email=care_request.requester_email,
        created_by_admin_id=admin.id,
        accepted_from_care_request=True,
    )

    care_request.status = CareRequestStatus.ACCEPTED
    care_request.linked_client_id = client.id
    care_request.reviewed_by_admin_id = admin.id
    care_request.reviewed_at = datetime.now(timezone.utc)

    log_action(
        db, admin.id, "admin", "care_request_accepted", "care_request", care_request.id,
        details={"linked_client_id": str(client.id), "access_code": client.access_code, "email_sent": email_sent},
    )
    db.commit()
    db.refresh(care_request)
    db.refresh(client)

    return CareRequestAcceptResponse(
        care_request=care_request, access_code=client.access_code, temporary_password=temp_password, email_sent=email_sent
    )


@router.post("/{request_id}/decline", response_model=CareRequestResponse)
def decline_care_request(
    request_id: UUID,
    payload: CareRequestDeclineRequest,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    care_request = db.query(CareRequest).filter(CareRequest.id == request_id).first()
    if not care_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care request not found")
    if care_request.status != CareRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This request has already been reviewed")
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reason is required to decline a request")

    care_request.status = CareRequestStatus.DECLINED
    care_request.decline_reason = payload.reason
    care_request.reviewed_by_admin_id = admin.id
    care_request.reviewed_at = datetime.now(timezone.utc)

    email_sent = send_care_request_declined_email(
        to_email=care_request.requester_email,
        requester_name=care_request.requester_name,
        reason=payload.reason,
    )

    log_action(
        db, admin.id, "admin", "care_request_declined", "care_request", care_request.id,
        details={"reason": payload.reason, "email_sent": email_sent},
    )
    db.commit()
    db.refresh(care_request)
    return care_request
