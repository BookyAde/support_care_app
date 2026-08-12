"""
Implements spec sections 6-8: Start Appointment, Visit Notes, End Appointment.
This is the most rule-heavy part of the whole system, so the logic lives here
rather than in the router, where it'd be easy to accidentally bypass a rule.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.shift import Shift
from app.models.visit import Visit
from app.models.visit_note import VisitNote
from app.models.enums import ShiftStatus, VisitStatus, NoteType


def start_visit(db: Session, shift_id: UUID, worker_id: UUID, gps_lat: float | None, gps_lng: float | None) -> Visit:
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

    # Security check: a worker can only start a visit for a shift assigned to THEM.
    # Without this, worker A could start/end worker B's visits by guessing shift IDs.
    if shift.worker_id != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This shift is not assigned to you")

    if shift.status != ShiftStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start a visit for a shift with status '{shift.status.value}'",
        )

    # NOTE: geofence enforcement (utils/geofence.py) plugs in here once Client
    # has stored lat/lng - currently deferred since geocoding client addresses
    # is a separate piece of work we haven't built yet. For now we record GPS
    # without blocking on it, matching the spec's "optional but recommended" wording.

    visit = Visit(
        shift_id=shift.id,
        actual_start_time=datetime.now(timezone.utc),
        gps_start_lat=gps_lat,
        gps_start_lng=gps_lng,
        status=VisitStatus.IN_PROGRESS,
    )
    shift.status = ShiftStatus.IN_PROGRESS

    db.add(visit)
    db.flush()
    return visit


def add_visit_note(db: Session, visit_id: UUID, worker_id: UUID, note_text: str) -> VisitNote:
    visit = _get_visit_owned_by_worker(db, visit_id, worker_id)

    if visit.status != VisitStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes can only be added while a visit is in progress",
        )

    note = VisitNote(visit_id=visit.id, note_text=note_text, note_type=NoteType.DURING_VISIT)
    db.add(note)
    db.flush()
    return note


def end_visit(
    db: Session,
    visit_id: UUID,
    worker_id: UUID,
    summary_note: str,
    gps_lat: float | None,
    gps_lng: float | None,
) -> Visit:
    visit = _get_visit_owned_by_worker(db, visit_id, worker_id)

    if visit.status != VisitStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only a visit that is in progress can be ended",
        )

    # This is the hard rule from the spec: "The worker cannot end the appointment
    # until the note is completed." Pydantic's min_length on the schema catches
    # empty strings, but we double-check here too since this function could
    # theoretically be called from elsewhere later (e.g. an admin override tool).
    if not summary_note or len(summary_note.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A summary note of at least 10 characters is required to end the visit",
        )

    end_time = datetime.now(timezone.utc)

    note = VisitNote(visit_id=visit.id, note_text=summary_note, note_type=NoteType.END_SUMMARY)
    db.add(note)

    visit.actual_end_time = end_time
    visit.gps_end_lat = gps_lat
    visit.gps_end_lng = gps_lng
    visit.status = VisitStatus.COMPLETED
    visit.shift.status = ShiftStatus.COMPLETED

    db.flush()
    return visit


def _get_visit_owned_by_worker(db: Session, visit_id: UUID, worker_id: UUID) -> Visit:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    if visit.shift.worker_id != worker_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This visit does not belong to you")
    return visit
