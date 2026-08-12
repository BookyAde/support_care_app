from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str


class ContactMessageResponse(BaseModel):
    email_sent: bool


class ContactMessageRecord(BaseModel):
    """A persisted contact form submission, as returned to an admin via
    GET /contact-messages - `delivered` is what an admin should scan for,
    since False means the notification email never reached support@."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    message: str
    delivered: bool
    created_at: datetime
