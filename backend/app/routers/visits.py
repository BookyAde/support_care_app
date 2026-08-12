from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_worker, get_current_admin
from app.services import visit_service
from app.services.audit_service import log_action
from app.models.visit import Visit
from app.models.shift import Shift
from app.models.enums import VisitStatus
from app.schemas.visit import StartVisitRequest, EndVisitRequest, VisitNoteCreate, VisitResponse, VisitNoteResponse

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("/shifts/{shift_id}/start", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def start_appointment(
    shift_id: UUID, payload: StartVisitRequest, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    gps = payload.gps
    visit = visit_service.start_visit(
        db, shift_id=shift_id, worker_id=worker.id,
        gps_lat=gps.latitude if gps else None, gps_lng=gps.longitude if gps else None,
    )
    log_action(db, worker.id, "worker", "visit_started", "visit", visit.id)
    db.commit()
    db.refresh(visit)
    return visit


@router.post("/{visit_id}/notes", response_model=VisitNoteResponse, status_code=status.HTTP_201_CREATED)
def add_note(
    visit_id: UUID, payload: VisitNoteCreate, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    note = visit_service.add_visit_note(db, visit_id=visit_id, worker_id=worker.id, note_text=payload.note_text)
    db.commit()
    db.refresh(note)
    return note


@router.post("/{visit_id}/end", response_model=VisitResponse)
def end_appointment(
    visit_id: UUID, payload: EndVisitRequest, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    gps = payload.gps
    visit = visit_service.end_visit(
        db, visit_id=visit_id, worker_id=worker.id, summary_note=payload.summary_note,
        gps_lat=gps.latitude if gps else None, gps_lng=gps.longitude if gps else None,
    )
    log_action(
        db, worker.id, "worker", "visit_ended", "visit", visit.id,
        details={"total_hours_worked": visit.total_hours_worked},
    )
    db.commit()
    db.refresh(visit)
    return visit


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(visit_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin-facing lookup - e.g. to review location records per spec section 9."""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    return visit

@router.get("/shifts/{shift_id}/active", response_model=VisitResponse)
def get_active_visit_for_shift(
    shift_id: UUID, worker=Depends(get_current_worker), db: Session = Depends(get_db)
):
    """
    Lets a worker recover the visit_id for a shift they already started, e.g. after a
    page refresh. Only returns a visit if it belongs to this worker's own shift and is
    still in progress, workers can't use this to peek at other workers' visits.
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift or shift.worker_id != worker.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

    visit = db.query(Visit).filter(Visit.shift_id == shift_id).first()
    if not visit or visit.status != VisitStatus.IN_PROGRESS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active visit for this shift")

    return visit
