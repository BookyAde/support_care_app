from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_worker
from app.core.security import hash_password
from app.models.worker import Worker
from app.models.worker_terms import WorkerTermsAcceptance
from app.models.message import Message
from app.models.shift import Shift
from app.services.worker_service import create_worker_with_credentials
from app.services.email_service import send_worker_credentials_email
from app.services.audit_service import log_action
from app.utils.generators import generate_temporary_password
from app.schemas.worker import (
    WorkerCreate,
    WorkerUpdate,
    WorkerProfileUpdate,
    WorkerDeactivateRequest,
    WorkerResponse,
    WorkerCreatedResponse,
)

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("", response_model=WorkerCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_worker(payload: WorkerCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    This is the full hiring flow: admin submits name (+ optional email), system
    generates employee_id + temp password, emails them automatically, and
    returns the credentials once so the admin has a fallback if the email fails.
    """
    worker, temp_password, email_sent = create_worker_with_credentials(
        db, full_name=payload.full_name, created_by_admin_id=admin.id, email=payload.email
    )

    log_action(
        db, admin.id, "admin", "worker_created", "worker", worker.id,
        details={"employee_id": worker.employee_id, "email_sent": email_sent},
    )
    db.commit()
    db.refresh(worker)

    return WorkerCreatedResponse(
        worker=worker, employee_id=worker.employee_id, temporary_password=temp_password, email_sent=email_sent
    )


@router.get("", response_model=list[WorkerResponse])
def list_workers(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Worker).order_by(Worker.created_at.desc()).all()


@router.get("/me", response_model=WorkerResponse)
def get_my_profile(worker=Depends(get_current_worker)):
    """Registered before GET /{worker_id} so 'me' is never matched as a worker_id."""
    return worker


@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return worker


@router.patch("/me", response_model=WorkerResponse)
def update_my_profile(
    payload: WorkerProfileUpdate, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    """A worker updating their own bio/phone_number - registered before the
    admin's PATCH /{worker_id} route so 'me' is never matched as a worker_id."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(worker, field, value)

    log_action(db, worker.id, "worker", "worker_profile_updated", "worker", worker.id)
    db.commit()
    db.refresh(worker)
    return worker


@router.patch("/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: UUID, payload: WorkerUpdate, admin=Depends(get_current_admin), db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(worker, field, value)

    log_action(db, admin.id, "admin", "worker_updated", "worker", worker.id)
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/{worker_id}/deactivate", response_model=WorkerResponse)
def deactivate_worker(
    worker_id: UUID,
    payload: WorkerDeactivateRequest,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    This is the 'instantly disable a worker's account' security requirement.
    Setting is_active=False takes effect immediately - the get_current_worker
    dependency checks this on every single request, so even a worker mid-session
    with a valid token is locked out on their very next API call.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    worker.is_active = False
    worker.deactivated_at = datetime.now(timezone.utc)
    worker.deactivation_reason = payload.reason

    log_action(
        db, admin.id, "admin", "worker_deactivated", "worker", worker.id, details={"reason": payload.reason}
    )
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/{worker_id}/reset-password", response_model=WorkerCreatedResponse)
def reset_worker_password(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Admin-initiated password reset - covers lost/forgotten test credentials
    with no other recovery path. Generates a fresh temporary password the
    same way account creation does, invalidates the old one immediately by
    overwriting password_hash, and forces a change on next login. Returns
    the plaintext temp password once, same shape as POST /workers, so the
    admin has a fallback if the email doesn't land.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    temporary_password = generate_temporary_password()
    worker.password_hash = hash_password(temporary_password)
    worker.must_change_password = True

    email_sent = False
    if worker.email:
        email_sent = send_worker_credentials_email(
            to_email=worker.email,
            full_name=worker.full_name,
            employee_id=worker.employee_id,
            temporary_password=temporary_password,
        )

    log_action(
        db, admin.id, "admin", "worker_password_reset", "worker", worker.id, details={"email_sent": email_sent}
    )
    db.commit()
    db.refresh(worker)

    return WorkerCreatedResponse(
        worker=worker, employee_id=worker.employee_id, temporary_password=temporary_password, email_sent=email_sent
    )


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Genuine last-resort hard delete - deactivation is the normal path for
    removing a worker's access while keeping their history. This only exists
    for cases like an account created by mistake. Blocked outright if the
    worker has any shift history: Shift.worker_id is NOT nullable, so
    deleting a worker with shifts would either violate that FK constraint or
    silently take their shift history with them - neither is acceptable, so
    we refuse instead of choosing between those two bad outcomes.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    has_shifts = db.query(Shift).filter(Shift.worker_id == worker_id).first() is not None
    if has_shifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This worker has shift history and cannot be deleted. Deactivate their account instead.",
        )

    db.query(WorkerTermsAcceptance).filter(WorkerTermsAcceptance.worker_id == worker_id).delete()
    db.query(Message).filter(Message.worker_id == worker_id).delete()

    db.delete(worker)
    log_action(db, admin.id, "admin", "worker_deleted", "worker", worker_id)
    db.commit()


@router.post("/{worker_id}/reactivate", response_model=WorkerResponse)
def reactivate_worker(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")

    worker.is_active = True
    worker.deactivated_at = None
    worker.deactivation_reason = None

    log_action(db, admin.id, "admin", "worker_reactivated", "worker", worker.id)
    db.commit()
    db.refresh(worker)
    return worker
