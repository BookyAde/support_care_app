"""
One function that every router calls whenever a meaningful action happens
(shift created, worker deactivated, etc). Centralising this means the audit log
format is consistent everywhere - no risk of one router logging slightly
different fields than another.
"""

from uuid import UUID
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    actor_id: UUID,
    actor_type: str,
    action: str,
    entity_type: str,
    entity_id: UUID,
    details: dict | None = None,
) -> None:
    entry = AuditLog(
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    # Deliberately NOT committing here - the calling route commits once, after
    # both the main action and the audit log are added, so they succeed or fail
    # together as a single atomic transaction.
