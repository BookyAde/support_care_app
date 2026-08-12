"""
Encapsulates the full "admin creates client login" flow we agreed on, mirroring
create_worker_with_credentials in worker_service.py:
1. Generate a unique access_code (retry on collision)
2. Generate a temporary password
3. Hash it and save the client
4. Email the credentials automatically
5. Return the plaintext temp password ONCE, so the admin can relay it manually
   if the email fails - it is never stored or retrievable again after this.
"""

from sqlalchemy.orm import Session

from app.models.client import Client
from app.core.security import hash_password
from app.utils.generators import generate_client_access_code, generate_temporary_password
from app.services.email_service import send_client_credentials_email


def create_client_with_credentials(
    db: Session,
    full_name: str,
    address: str,
    contact_number: str,
    emergency_contact: str,
    created_by_admin_id,
    care_plan: str | None = None,
    special_instructions: str | None = None,
    risk_assessment: str | None = None,
    medical_notes: str | None = None,
    email: str | None = None,
    accepted_from_care_request: bool = False,
) -> tuple[Client, str, bool]:
    # Retry loop guards against the rare case of a random access_code collision
    access_code = generate_client_access_code()
    while db.query(Client).filter(Client.access_code == access_code).first() is not None:
        access_code = generate_client_access_code()

    temporary_password = generate_temporary_password()

    client = Client(
        full_name=full_name,
        address=address,
        contact_number=contact_number,
        emergency_contact=emergency_contact,
        care_plan=care_plan,
        special_instructions=special_instructions,
        risk_assessment=risk_assessment,
        medical_notes=medical_notes,
        access_code=access_code,
        email=email,
        password_hash=hash_password(temporary_password),
        must_change_password=True,
        is_active=True,
        created_by_admin_id=created_by_admin_id,
    )
    db.add(client)
    db.flush()  # assigns client.id without committing yet, so audit log can reference it in the same transaction

    email_sent = False
    if email:
        email_sent = send_client_credentials_email(
            to_email=email,
            full_name=full_name,
            access_code=access_code,
            temporary_password=temporary_password,
            accepted_from_care_request=accepted_from_care_request,
        )

    return client, temporary_password, email_sent
