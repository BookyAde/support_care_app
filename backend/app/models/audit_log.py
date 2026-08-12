"""
AuditLog = operational trail for compliance ("who did what, when").
Separate from worker_terms_acceptance, which is legal/contractual evidence.

`details` is JSONB so we can store flexible, action-specific context (e.g. for a
"shift_reassigned" action: {"old_worker_id": ..., "new_worker_id": ...}) without
needing a new column for every possible action type.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    actor_id = Column(UUID(as_uuid=True), nullable=False)
    actor_type = Column(String, nullable=False)  # "admin" or "worker"

    action = Column(String, nullable=False)  # e.g. "shift_created", "worker_deactivated"
    entity_type = Column(String, nullable=False)  # e.g. "shift", "worker", "client"
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    details = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
