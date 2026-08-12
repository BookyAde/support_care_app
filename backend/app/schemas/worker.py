from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class WorkerCreate(BaseModel):
    """
    Admin fills this in after interviewing/hiring. Note: no password field here -
    the system auto-generates the employee_id and a temporary password, then
    emails them to the worker. The admin never sets or sees the temp password
    directly, which is better security practice than an admin choosing it.
    """
    full_name: str
    email: EmailStr | None = None  # optional at creation - worker can link later


class WorkerUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class WorkerProfileUpdate(BaseModel):
    """What a worker may edit about themselves via PATCH /workers/me - deliberately
    excludes full_name, employee_id, and anything else admin-controlled."""
    bio: str | None = None
    phone_number: str | None = None


class WorkerDeactivateRequest(BaseModel):
    reason: str


class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    employee_id: str
    email: EmailStr | None
    bio: str | None
    phone_number: str | None
    is_active: bool
    must_change_password: bool
    created_at: datetime


class WorkerCreatedResponse(BaseModel):
    """Returned once, right after creation, so the admin can see (and optionally
    manually relay) the credentials in case the email fails to send."""
    worker: WorkerResponse
    employee_id: str
    temporary_password: str
    email_sent: bool
