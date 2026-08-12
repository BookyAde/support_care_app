"""
Message = a single message in a two-way conversation thread between an admin
team and one worker OR one client. Threads are keyed by worker_id or client_id
(exactly one of the two is set, never both), not by a specific admin, since in
practice a worker/client is talking to "the office," not one named person.
sender_type distinguishes who wrote it ("admin", "worker", or "client").
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True, index=True)
    sender_type = Column(String, nullable=False)
    sender_id = Column(UUID(as_uuid=True), nullable=False)
    body = Column(Text, nullable=False)
    is_broadcast = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    # Soft-delete: body is intentionally NOT cleared when this is set, so the
    # original text stays in the database for audit purposes - it's up to the
    # frontend to hide/replace the display text for a deleted message.
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
