from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import APIRouter, Depends, Query

from app.database import get_db
from app.core.dependencies import get_current_admin
from app.models.shift import Shift
from app.models.visit import Visit
from app.models.client import Client
from app.models.worker import Worker
from app.models.enums import ShiftStatus, VisitStatus

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard_analytics(admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Powers spec section 12: Total Clients, Active Workers, Scheduled/Completed/
    Missed Visits, Hours Delivered. Kept as simple aggregate COUNT/SUM queries -
    fine at this scale; if visit volume grows large later, these could move to
    a nightly-refreshed materialized view instead of live queries.
    """
    total_clients = db.query(func.count(Client.id)).scalar()
    active_workers = db.query(func.count(Worker.id)).filter(Worker.is_active == True).scalar()  # noqa: E712

    scheduled_visits = db.query(func.count(Shift.id)).filter(Shift.status == ShiftStatus.SCHEDULED).scalar()
    completed_visits = db.query(func.count(Visit.id)).filter(Visit.status == VisitStatus.COMPLETED).scalar()

    # VisitStatus.MISSED is never actually set anywhere in the codebase, so counting
    # it always returned 0. "Missed" is better defined as a scheduled shift whose
    # start time is 30+ minutes past with no check-in yet - see Shift.is_overdue.
    missed_visits = db.query(Shift).filter(Shift.status == ShiftStatus.SCHEDULED).all()
    missed_visits = len([s for s in missed_visits if s.is_overdue])

    completed = (
        db.query(Visit.actual_start_time, Visit.actual_end_time)
        .filter(Visit.status == VisitStatus.COMPLETED)
        .all()
    )
    total_hours = sum(
        (end - start).total_seconds() / 3600
        for start, end in completed
        if start and end
    )

    return {
        "total_clients": total_clients,
        "active_workers": active_workers,
        "scheduled_visits": scheduled_visits,
        "completed_visits": completed_visits,
        "missed_visits": missed_visits,
        "hours_delivered": round(total_hours, 2),
    }


@router.get("/visits")
def visit_report(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    worker_id: str | None = Query(None),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Powers spec section 11: payroll/compliance report showing Worker, Client,
    Visit Date, Start/End Time, Hours Worked, Notes, Attendance History.
    PDF/Excel export is deliberately not built here - that's a separate concern
    (formatting/rendering) and belongs in its own export service once this data
    shape is confirmed as correct.
    """
    query = db.query(Shift).join(Visit, Shift.id == Visit.shift_id, isouter=True)

    if start_date:
        query = query.filter(Shift.scheduled_date >= start_date)
    if end_date:
        query = query.filter(Shift.scheduled_date <= end_date)
    if worker_id:
        query = query.filter(Shift.worker_id == worker_id)

    shifts = query.order_by(Shift.scheduled_date.desc()).all()

    return [
        {
            "shift_id": str(shift.id),
            "visit_id": str(shift.visit.id) if shift.visit else None,
            "worker_name": shift.worker.full_name,
            "client_name": shift.client.full_name,
            "scheduled_date": shift.scheduled_date,
            "shift_status": shift.status.value,
            "actual_start_time": shift.visit.actual_start_time if shift.visit else None,
            "actual_end_time": shift.visit.actual_end_time if shift.visit else None,
            "total_hours_worked": shift.visit.total_hours_worked if shift.visit else None,
            "visit_status": shift.visit.status.value if shift.visit else None,
        }
        for shift in shifts
    ]
