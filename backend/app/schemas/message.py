from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    body: str


class MessageUpdate(BaseModel):
    body: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    worker_id: UUID | None
    client_id: UUID | None
    sender_type: str
    body: str
    is_broadcast: bool
    read_at: datetime | None
    edited_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
