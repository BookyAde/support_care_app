from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_worker, get_current_client
from app.models.shift import Shift
from app.models.enums import ShiftStatus, WorkerResponseStatus
from app.services.audit_service import log_action
from app.schemas.shift import ShiftCreate, ShiftUpdate, ShiftResponse, ShiftRespondRequest

router = APIRouter(prefix="/shifts", tags=["shifts"])


@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(payload: ShiftCreate, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    shift = Shift(**payload.model_dump(), created_by_admin_id=admin.id)
    db.add(shift)
    db.flush()

    # TODO (next feature to build): trigger an in-app + push notification to the
    # assigned worker here, per spec section 4 ("worker should receive an in-app
    # notification"). Deferred until we design the notifications table/service.

    log_action(db, admin.id, "admin", "shift_created", "shift", shift.id)
    db.commit()
    db.refresh(shift)
    return shift


@router.get("", response_model=list[ShiftResponse])
def list_shifts(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Shift).order_by(Shift.scheduled_date.desc()).all()


@router.get("/my-shifts", response_model=list[ShiftResponse])
def my_shifts(worker=Depends(get_current_worker), db: Session = Depends(get_db)):
    """Powers the worker dashboard's 'Today's Visits' view (spec section 5)."""
    return db.query(Shift).filter(Shift.worker_id == worker.id).order_by(Shift.scheduled_date.desc()).all()


@router.get("/my-visits", response_model=list[ShiftResponse])
def my_visits(client=Depends(get_current_client), db: Session = Depends(get_db)):
    """Powers the client app's visit history view - mirrors my_shifts above but
    scoped to the client's own shifts instead of a worker's."""
    return db.query(Shift).filter(Shift.client_id == client.id).order_by(Shift.scheduled_date.desc()).all()


@router.patch("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: UUID, payload: ShiftUpdate, admin=Depends(get_current_admin), db: Session = Depends(get_db)
):
    """Covers edit, cancel, and reassign - all are just field updates on the same shift."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(shift, field, value)

    log_action(db, admin.id, "admin", "shift_updated", "shift", shift.id)
    db.commit()
    db.refresh(shift)
    return shift


@router.post("/{shift_id}/respond", response_model=ShiftResponse)
def respond_to_shift(
    shift_id: UUID, payload: ShiftRespondRequest, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if shift.worker_id != worker.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This shift is not assigned to you")
    if shift.status != ShiftStatus.SCHEDULED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This shift can no longer be responded to")
    if payload.response not in ("accepted", "declined"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Response must be 'accepted' or 'declined'")
    if payload.response == "declined" and (not payload.reason or not payload.reason.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reason is required to decline a shift")

    shift.worker_response = WorkerResponseStatus.ACCEPTED if payload.response == "accepted" else WorkerResponseStatus.DECLINED
    shift.decline_reason = payload.reason if payload.response == "declined" else None
    shift.responded_at = datetime.now(timezone.utc)
    log_action(db, worker.id, "worker", f"shift_{payload.response}", "shift", shift.id, details={"reason": payload.reason} if payload.reason else None)
    db.commit()
    db.refresh(shift)
    return shift
