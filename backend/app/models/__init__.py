"""
Why this file matters:
Alembic (our migration tool) detects tables by scanning everything that inherits
from `Base`. If a model file is never imported anywhere, Alembic won't know it
exists and won't create a migration for it. Importing every model here, once,
guarantees nothing gets silently skipped.
"""

from app.models.admin import Admin
from app.models.worker import Worker
from app.models.worker_terms import WorkerTermsAcceptance
from app.models.client import Client
from app.models.client_terms import ClientTermsAcceptance
from app.models.shift import Shift
from app.models.visit import Visit
from app.models.visit_note import VisitNote
from app.models.audit_log import AuditLog
from app.models.message import Message
from app.models.care_request import CareRequest
from app.models.rating import Rating
from app.models.thread_read import AdminThreadRead
from app.models.contact_message import ContactMessage

__all__ = [
    "Admin",
    "Worker",
    "WorkerTermsAcceptance",
    "Client",
    "ClientTermsAcceptance",
    "Shift",
    "Visit",
    "VisitNote",
    "AuditLog",
    "Message",
    "CareRequest",
    "Rating",
    "AdminThreadRead",
    "ContactMessage",
]
