from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.admin import Admin
from app.models.client import Client
from app.models.worker import Worker
from app.models.shift import Shift
from app.services.admin_service import create_admin_with_credentials
from app.services.audit_service import log_action
from app.schemas.admin import AdminCreate, AdminResponse, AdminCreatedResponse

router = APIRouter(prefix="/admins", tags=["admins"])


def _active_admin_count_excluding(db: Session, admin_id: UUID) -> int:
    """How many OTHER admins are currently active - the number that would be
    left if `admin_id` were deactivated/deleted right now. Used by both
    safeguards below so deactivate and delete enforce the exact same rule."""
    return db.query(Admin).filter(Admin.is_active == True, Admin.id != admin_id).count()  # noqa: E712


@router.post("", response_model=AdminCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    This is the "add a teammate" flow: admin submits name + email, system
    generates a temp password, emails it automatically, and returns the
    credentials once so the inviting admin has a fallback if the email
    fails - mirrors POST /workers and POST /clients exactly.
    """
    existing = db.query(Admin).filter(Admin.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An admin with this email already exists")

    new_admin, temp_password, email_sent = create_admin_with_credentials(
        db, full_name=payload.full_name, email=payload.email
    )

    log_action(
        db, admin.id, "admin", "admin_created", "admin", new_admin.id,
        details={"email": new_admin.email, "email_sent": email_sent},
    )
    db.commit()
    db.refresh(new_admin)

    return AdminCreatedResponse(admin=new_admin, temporary_password=temp_password, email_sent=email_sent)


@router.get("", response_model=list[AdminResponse])
def list_admins(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Admin).order_by(Admin.created_at.desc()).all()


@router.post("/{admin_id}/deactivate", response_model=AdminResponse)
def deactivate_admin(admin_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    target = db.query(Admin).filter(Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    if target.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")

    if _active_admin_count_excluding(db, admin_id) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is the last active admin account - deactivating it would lock everyone out",
        )

    target.is_active = False
    log_action(db, admin.id, "admin", "admin_deactivated", "admin", target.id)
    db.commit()
    db.refresh(target)
    return target


@router.post("/{admin_id}/reactivate", response_model=AdminResponse)
def reactivate_admin(admin_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    target = db.query(Admin).filter(Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    target.is_active = True
    log_action(db, admin.id, "admin", "admin_reactivated", "admin", target.id)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(admin_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    target = db.query(Admin).filter(Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")

    if target.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")

    if _active_admin_count_excluding(db, admin_id) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is the last active admin account - deleting it would lock everyone out",
        )

    # Deleting an admin outright must not cascade into deleting everything
    # they ever created - the client/worker/shift records are real
    # operational history, not the admin's personal data. Null out the
    # attribution instead, same precedent as care_requests.reviewed_by_admin_id
    # (already nullable) - preserves the record, loses only "created by".
    db.query(Client).filter(Client.created_by_admin_id == admin_id).update({"created_by_admin_id": None})
    db.query(Worker).filter(Worker.created_by_admin_id == admin_id).update({"created_by_admin_id": None})
    db.query(Shift).filter(Shift.created_by_admin_id == admin_id).update({"created_by_admin_id": None})

    db.delete(target)
    log_action(db, admin.id, "admin", "admin_deleted", "admin", admin_id)
    db.commit()
