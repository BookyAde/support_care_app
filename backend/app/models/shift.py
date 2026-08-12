"""
Shift = a scheduled assignment of a worker to a client at a specific date/time.
A Shift is the *plan*; a Visit (next file) is what *actually happened*. Splitting
these two concepts is important: a shift can be cancelled before any visit exists,
and a shift's scheduled time can differ from the visit's actual start/end time
(e.g. worker arrives late) - we want both facts recorded, not overwritten.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, Date, Time, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ShiftStatus, WorkerResponseStatus


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False)

    scheduled_date = Column(Date, nullable=False)
    scheduled_start = Column(Time, nullable=False)
    scheduled_end = Column(Time, nullable=False)

    status = Column(Enum(ShiftStatus), default=ShiftStatus.SCHEDULED, nullable=False)

    worker_response = Column(Enum(WorkerResponseStatus), default=WorkerResponseStatus.PENDING, nullable=False)
    decline_reason = Column(Text, nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Nullable so deleting the admin who created this shift doesn't force
    # deleting the shift too - DELETE /admins/{id} nulls this out instead,
    # preserving the record while losing "created by" attribution, same
    # precedent as care_requests.reviewed_by_admin_id.
    created_by_admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    client = relationship("Client", back_populates="shifts")
    worker = relationship("Worker", back_populates="shifts")
    visit = relationship("Visit", back_populates="shift", uselist=False)

    @property
    def client_name(self) -> str:
        return self.client.full_name

    @property
    def worker_name(self) -> str:
        return self.worker.full_name

    @property
    def is_overdue(self) -> bool:
        if self.status != ShiftStatus.SCHEDULED:
            return False
        scheduled_dt = datetime.combine(self.scheduled_date, self.scheduled_start, tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > scheduled_dt + timedelta(minutes=30)
