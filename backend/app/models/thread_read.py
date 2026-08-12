"""
AdminThreadRead = tracks the last time "the office" (admin team, not one named
admin - mirroring how Message threads aren't tied to a specific admin either)
read a given worker or client thread. This is what makes a real unread-message
count possible: a message counts as unread if it was sent by that worker/client
(sender_type != "admin") after this row's last_read_at.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AdminThreadRead(Base):
    __tablename__ = "admin_thread_reads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True)
    last_read_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
