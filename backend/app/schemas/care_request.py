from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.enums import CareRequestStatus


class CareRequestCreate(BaseModel):
    requester_name: str
    requester_relationship: str
    requester_phone: str
    requester_email: EmailStr
    care_recipient_name: str
    care_recipient_address: str
    care_type_summary: str | None = None
    additional_notes: str | None = None
    frequency: str | None = None
    is_urgent: bool = False
    honeypot: str = ""  # hidden field real visitors never see - non-empty means a bot filled it in


class CareRequestMineCreate(BaseModel):
    """What an already-authenticated client submits from their own dashboard -
    a much shorter form than the public one, since requester/recipient details
    are all auto-filled from the client's own record rather than typed in."""
    care_type_summary: str | None = None
    additional_notes: str | None = None
    frequency: str | None = None
    is_urgent: bool = False


class CareRequestDeclineRequest(BaseModel):
    reason: str


class CareRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    requester_name: str
    requester_relationship: str
    requester_phone: str
    requester_email: EmailStr
    care_recipient_name: str
    care_recipient_address: str
    care_type_summary: str | None
    additional_notes: str | None
    frequency: str | None
    is_urgent: bool
    status: CareRequestStatus
    decline_reason: str | None
    linked_client_id: UUID | None
    existing_client_id: UUID | None
    is_existing_client: bool
    reviewed_by_admin_id: UUID | None
    reviewed_at: datetime | None
    created_at: datetime


class CareRequestAcceptResponse(BaseModel):
    """Returned after accepting a request, mirroring ClientCreatedResponse's
    shape so the admin sees exactly what credentials were generated - unless
    the request came from an existing client, in which case no new credentials
    are generated at all and needs_manual_followup explains why."""
    care_request: CareRequestResponse
    access_code: str | None = None
    temporary_password: str | None = None
    email_sent: bool | None = None
    needs_manual_followup: bool = False
    message: str | None = None
