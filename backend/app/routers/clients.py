from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_client
from app.core.security import hash_password
from app.models.client import Client
from app.models.client_terms import ClientTermsAcceptance
from app.models.audit_log import AuditLog
from app.models.shift import Shift
from app.models.care_request import CareRequest
from app.services.client_auth_service import create_client_with_credentials
from app.services.email_service import send_client_credentials_email
from app.services.audit_service import log_action
from app.utils.generators import generate_temporary_password
from app.schemas.client import ClientCreate, ClientUpdate, ClientSelfUpdate, ClientResponse, ClientCreatedResponse

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    This is the full "add a client" flow: admin submits their details (+ optional
    email), system generates an access_code + temp password, emails them
    automatically if an email was provided, and returns the credentials once so
    the admin has a fallback if the email fails - mirrors POST /workers exactly.
    """
    client, temp_password, email_sent = create_client_with_credentials(
        db,
        full_name=payload.full_name,
        address=payload.address,
        contact_number=payload.contact_number,
        emergency_contact=payload.emergency_contact,
        care_plan=payload.care_plan,
        special_instructions=payload.special_instructions,
        risk_assessment=payload.risk_assessment,
        medical_notes=payload.medical_notes,
        created_by_admin_id=admin.id,
        email=payload.email,
    )

    log_action(
        db, admin.id, "admin", "client_created", "client", client.id,
        details={"access_code": client.access_code, "email_sent": email_sent},
    )
    db.commit()
    db.refresh(client)

    return ClientCreatedResponse(
        client=client, access_code=client.access_code, temporary_password=temp_password, email_sent=email_sent
    )


@router.get("", response_model=list[ClientResponse])
def list_clients(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.created_at.desc()).all()


@router.get("/me", response_model=ClientResponse)
def get_my_profile(client=Depends(get_current_client)):
    """Registered before GET /{client_id} so 'me' is never matched as a client_id."""
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.patch("/me", response_model=ClientResponse)
def update_my_profile(
    payload: ClientSelfUpdate, client=Depends(get_current_client), db: Session = Depends(get_db)
):
    """A client updating their own contact details - registered before the
    admin's PATCH /{client_id} route so 'me' is never matched as a client_id."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    log_action(db, client.id, "client", "client_profile_updated", "client", client.id)
    db.commit()
    db.refresh(client)
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID, payload: ClientUpdate, admin=Depends(get_current_admin), db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    log_action(db, admin.id, "admin", "client_updated", "client", client.id)
    db.commit()
    db.refresh(client)
    return client


@router.post("/{client_id}/reset-password", response_model=ClientCreatedResponse)
def reset_client_password(client_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Admin-initiated password reset, mirrors POST /workers/{worker_id}/reset-password
    exactly. Generates a fresh temporary password, invalidates the old one
    immediately by overwriting password_hash, and forces a change on next
    login. Returns the plaintext temp password once, same shape as
    POST /clients, so the admin has a fallback if the email doesn't land.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    temporary_password = generate_temporary_password()
    client.password_hash = hash_password(temporary_password)
    client.must_change_password = True

    email_sent = False
    if client.email:
        email_sent = send_client_credentials_email(
            to_email=client.email,
            full_name=client.full_name,
            access_code=client.access_code,
            temporary_password=temporary_password,
        )

    log_action(
        db, admin.id, "admin", "client_password_reset", "client", client.id, details={"email_sent": email_sent}
    )
    db.commit()
    db.refresh(client)

    return ClientCreatedResponse(
        client=client, access_code=client.access_code, temporary_password=temporary_password, email_sent=email_sent
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    # Same last-resort rule as DELETE /workers/{worker_id}: Shift.client_id is
    # NOT nullable, so a client with shift history can never be safely
    # hard-deleted - refuse outright rather than violate that FK constraint
    # or silently take their shift history with them.
    has_shifts = db.query(Shift).filter(Shift.client_id == client_id).first() is not None
    if has_shifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This client has shift history and cannot be deleted. Deactivate their account instead.",
        )

    # Deleting a client outright (rare - most removal is deactivation) means
    # clearing everything that references it first, or the FK constraint on
    # client_terms_acceptance.client_id blows up with a 500. Order matters:
    # dependent rows go before the client itself, all in one transaction so a
    # failure partway through can't leave the client half-deleted.
    #
    # care_requests.existing_client_id/linked_client_id are NULLED, not
    # deleted-with-cascade: the care request itself is a real historical
    # record (who asked for care, when, what was decided) that should
    # survive the client record being removed - it just loses the link to
    # an account that no longer exists, same precedent as
    # created_by_admin_id being nulled out when an admin is deleted.
    db.query(CareRequest).filter(CareRequest.existing_client_id == client_id).update(
        {"existing_client_id": None}
    )
    db.query(CareRequest).filter(CareRequest.linked_client_id == client_id).update({"linked_client_id": None})
    db.query(ClientTermsAcceptance).filter(ClientTermsAcceptance.client_id == client_id).delete()
    db.query(AuditLog).filter(AuditLog.entity_type == "client", AuditLog.entity_id == client_id).delete()

    db.delete(client)
    log_action(db, admin.id, "admin", "client_deleted", "client", client_id)
    db.commit()
