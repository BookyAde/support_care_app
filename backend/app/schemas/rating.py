from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: str | None = None


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shift_id: UUID
    client_id: UUID
    worker_id: UUID
    stars: int
    comment: str | None
    created_at: datetime
