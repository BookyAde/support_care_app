"""
Encapsulates the full "admin hires worker" flow we agreed on:
1. Generate a unique employee_id (retry on collision)
2. Generate a temporary password
3. Hash it and save the worker
4. Email the credentials automatically
5. Return the plaintext temp password ONCE, so the admin can relay it manually
   if the email fails - it is never stored or retrievable again after this.
"""

from sqlalchemy.orm import Session

from app.models.worker import Worker
from app.core.security import hash_password
from app.utils.generators import generate_employee_id, generate_temporary_password
from app.services.email_service import send_worker_credentials_email


def create_worker_with_credentials(
    db: Session,
    full_name: str,
    created_by_admin_id,
    email: str | None = None,
) -> tuple[Worker, str, bool]:
    # Retry loop guards against the rare case of a random employee_id collision
    employee_id = generate_employee_id()
    while db.query(Worker).filter(Worker.employee_id == employee_id).first() is not None:
        employee_id = generate_employee_id()

    temporary_password = generate_temporary_password()

    worker = Worker(
        full_name=full_name,
        employee_id=employee_id,
        email=email,
        password_hash=hash_password(temporary_password),
        must_change_password=True,
        is_active=True,
        created_by_admin_id=created_by_admin_id,
    )
    db.add(worker)
    db.flush()  # assigns worker.id without committing yet, so audit log can reference it in the same transaction

    email_sent = False
    if email:
        email_sent = send_worker_credentials_email(
            to_email=email,
            full_name=full_name,
            employee_id=employee_id,
            temporary_password=temporary_password,
        )

    return worker, temporary_password, email_sent
