from uuid import UUID
from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import ShiftStatus, WorkerResponseStatus


class ShiftCreate(BaseModel):
    client_id: UUID
    worker_id: UUID
    scheduled_date: date
    scheduled_start: time
    scheduled_end: time


class ShiftUpdate(BaseModel):
    """Covers 'edit, cancel, or reassign shifts' from the spec - all optional
    since an admin might only change one field, e.g. just the worker (reassign)."""
    worker_id: UUID | None = None
    scheduled_date: date | None = None
    scheduled_start: time | None = None
    scheduled_end: time | None = None
    status: ShiftStatus | None = None


class ShiftClientDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    address: str
    contact_number: str
    care_plan: str | None
    special_instructions: str | None
    risk_assessment: str | None
    medical_notes: str | None


class ShiftRespondRequest(BaseModel):
    response: str
    reason: str | None = None


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    worker_id: UUID
    client_name: str
    worker_name: str
    scheduled_date: date
    scheduled_start: time
    scheduled_end: time
    status: ShiftStatus
    worker_response: WorkerResponseStatus
    decline_reason: str | None
    responded_at: datetime | None
    is_overdue: bool
    client: ShiftClientDetail
    created_at: datetime
