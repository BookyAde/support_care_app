"""
Tracks legal acceptance of Terms & Conditions - kept separate from operational
audit_logs because this is legal/contractual evidence, not a system action log.

We store `terms_version` (not just a boolean) so that if the T&C text changes later,
we can tell exactly which version a worker agreed to, and force re-acceptance of a
newer version if needed. `ip_address` gives an extra layer of proof of acceptance.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class WorkerTermsAcceptance(Base):
    __tablename__ = "worker_terms_acceptance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False)
    terms_version = Column(String, nullable=False)
    accepted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ip_address = Column(String, nullable=True)

    worker = relationship("Worker", back_populates="terms_acceptances")
