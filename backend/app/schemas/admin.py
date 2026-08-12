from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class AdminCreate(BaseModel):
    """
    Admin fills this in to add a teammate. No password field - same reasoning
    as WorkerCreate/ClientCreate: the system auto-generates a temporary
    password and emails it, rather than an admin choosing one for someone
    else. Unlike Worker/Client, email is required here (not optional) since
    an admin has no separate employee_id/access_code-style login - email +
    password is the only way in.
    """
    full_name: str
    email: EmailStr


class AdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    is_active: bool
    must_change_password: bool
    created_at: datetime


class AdminCreatedResponse(BaseModel):
    """Returned once, right after creation, so the creating admin can see
    (and optionally manually relay) the credentials in case the email fails
    to send - mirrors WorkerCreatedResponse/ClientCreatedResponse exactly."""
    admin: AdminResponse
    temporary_password: str
    email_sent: bool
