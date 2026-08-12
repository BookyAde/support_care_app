"""
Admin = company staff who use the backend management portal.
Kept as its own table (not merged with `workers`) because admins and workers have
completely different login flows, permissions, and data - merging them into one
`users` table with a `role` column would mean every worker-specific query needs to
filter `WHERE role = 'worker'`, which is easy to forget and a real security risk
(imagine forgetting that filter on a route that should never return admin accounts).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    # Mirrors Worker/Client: True for an admin created via POST /admins (given
    # a generated temp password to relay), False for one created directly via
    # create_admin.py (they chose their own password, nothing to force).
    must_change_password = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
