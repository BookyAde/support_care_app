"""
Visit = the real, actual record of a worker's time at a client's location.
One-to-one with a Shift (a shift produces exactly one visit once it starts).

GPS fields are stored as separate lat/lng floats rather than a single string so we
can do distance calculations in the database or application layer (e.g. the
geofencing check: "is this worker within 150m of the client's address?").
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import VisitStatus


class Visit(Base):
    __tablename__ = "visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=False, unique=True)

    actual_start_time = Column(DateTime(timezone=True), nullable=True)
    actual_end_time = Column(DateTime(timezone=True), nullable=True)

    gps_start_lat = Column(Float, nullable=True)
    gps_start_lng = Column(Float, nullable=True)
    gps_end_lat = Column(Float, nullable=True)
    gps_end_lng = Column(Float, nullable=True)

    status = Column(Enum(VisitStatus), default=VisitStatus.SCHEDULED, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    shift = relationship("Shift", back_populates="visit")
    notes = relationship("VisitNote", back_populates="visit")

    @property
    def total_hours_worked(self) -> float | None:
        """Computed, not stored - always derived from actual timestamps so it can
        never drift out of sync if a timestamp is corrected later."""
        if self.actual_start_time and self.actual_end_time:
            delta = self.actual_end_time - self.actual_start_time
            return round(delta.total_seconds() / 3600, 2)
        return None
