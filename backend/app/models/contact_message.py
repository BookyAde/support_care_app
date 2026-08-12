"""
ContactMessage = a persisted record of every submission through the public
marketing-site contact form. Saved regardless of whether the notification
email to support@ actually goes out, so a Resend outage means a `delivered`
row silently sitting there for an admin to catch via GET /contact-messages,
never a message that's simply gone.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    # Whether the notification email to support@ actually sent - False means
    # this submission would otherwise have been silently lost.
    delivered = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
