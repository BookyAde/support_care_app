"""
VisitNote = free-text notes a worker logs during or at the end of a visit.
`note_type` distinguishes optional during-visit notes from the MANDATORY
end-of-visit summary (the spec is explicit: a worker cannot end a visit without
submitting this note - that rule is enforced in the service layer, not here).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import NoteType


class VisitNote(Base):
    __tablename__ = "visit_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    note_type = Column(Enum(NoteType), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    visit = relationship("Visit", back_populates="notes")
