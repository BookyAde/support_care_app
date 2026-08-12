"""
CareRequest = a public "I need care for someone" submission from the marketing
site, before any admin has reviewed it. Anyone can submit one without an
account - this is the public front door into the system, distinct from Client
which only exists once an admin has actually accepted a request (or added a
client directly via POST /clients).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.enums import CareRequestStatus


class CareRequest(Base):
    __tablename__ = "care_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    requester_name = Column(String, nullable=False)
    requester_relationship = Column(String, nullable=False)
    requester_phone = Column(String, nullable=False)
    requester_email = Column(String, nullable=False)

    care_recipient_name = Column(String, nullable=False)
    care_recipient_address = Column(String, nullable=False)

    care_type_summary = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    frequency = Column(String, nullable=True)
    is_urgent = Column(Boolean, default=False, nullable=False)

    status = Column(Enum(CareRequestStatus), default=CareRequestStatus.PENDING, nullable=False)
    decline_reason = Column(String, nullable=True)

    linked_client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    reviewed_by_admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Set only when an already-authenticated client submitted this request from
    # their own dashboard (POST /care-requests/mine), as opposed to an anonymous
    # stranger using the public marketing-site form. This is what tells accept()
    # not to create a duplicate client record for someone who already has one.
    existing_client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @property
    def is_existing_client(self) -> bool:
        return self.existing_client_id is not None
