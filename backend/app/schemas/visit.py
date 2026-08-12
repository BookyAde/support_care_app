from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import VisitStatus, NoteType


class GPSCoordinate(BaseModel):
    """Reusable shape for GPS pairs sent from the worker app's Geolocation API."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class StartVisitRequest(BaseModel):
    gps: GPSCoordinate | None = None  # optional but recommended, per spec section 9


class EndVisitRequest(BaseModel):
    gps: GPSCoordinate | None = None
    summary_note: str = Field(..., min_length=10)  # mandatory end-of-visit note - enforced by min_length + service logic


class VisitNoteCreate(BaseModel):
    note_text: str = Field(..., min_length=1)


class VisitNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    note_text: str
    note_type: NoteType
    created_at: datetime


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shift_id: UUID
    actual_start_time: datetime | None
    actual_end_time: datetime | None
    status: VisitStatus
    total_hours_worked: float | None = None
    gps_start_lat: float | None
    gps_start_lng: float | None
    gps_end_lat: float | None
    gps_end_lng: float | None
    notes: list[VisitNoteResponse] = []
