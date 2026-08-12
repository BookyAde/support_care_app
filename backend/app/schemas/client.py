from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class ClientBase(BaseModel):
    full_name: str
    address: str
    contact_number: str
    emergency_contact: str
    care_plan: str | None = None
    special_instructions: str | None = None
    risk_assessment: str | None = None
    medical_notes: str | None = None


class ClientCreate(ClientBase):
    email: EmailStr | None = None  # optional at creation - client can link later, mirrors WorkerCreate


class ClientUpdate(BaseModel):
    full_name: str | None = None
    address: str | None = None
    contact_number: str | None = None
    emergency_contact: str | None = None
    care_plan: str | None = None
    special_instructions: str | None = None
    risk_assessment: str | None = None
    medical_notes: str | None = None


class ClientSelfUpdate(BaseModel):
    """What a client may edit about themselves via PATCH /clients/me -
    deliberately excludes full_name (admin-controlled, mirrors
    WorkerProfileUpdate excluding full_name) and care_plan/risk_assessment/
    medical_notes (clinical, admin-only)."""
    address: str | None = None
    contact_number: str | None = None
    emergency_contact: str | None = None
    special_instructions: str | None = None


class ClientResponse(ClientBase):
    model_config = ConfigDict(from_attributes=True)  # lets Pydantic read directly from the SQLAlchemy object

    id: UUID
    access_code: str
    email: EmailStr | None
    is_active: bool
    must_change_password: bool
    created_at: datetime


class ClientCreatedResponse(BaseModel):
    """Returned once, right after creation, so the admin can see (and optionally
    manually relay) the credentials in case the email fails to send."""
    client: ClientResponse
    access_code: str
    temporary_password: str
    email_sent: bool
