"""
Encapsulates the "admin invites another admin" flow, mirroring
create_worker_with_credentials()/create_client_with_credentials() exactly:
1. Generate a temporary password
2. Hash it and save the new admin
3. Email the credentials automatically
4. Return the plaintext temp password ONCE, so the inviting admin can relay
   it manually if the email fails - it is never stored or retrievable again
   after this.

No unique-code generation step here (unlike employee_id/access_code) since
an admin's email IS their login identifier - Admin.email is already
unique/nullable=False at the DB level, so a collision surfaces as a normal
"email already in use" case for the caller to handle, not something this
function needs to retry around.
"""

from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.core.security import hash_password
from app.utils.generators import generate_temporary_password
from app.services.email_service import send_admin_credentials_email


def create_admin_with_credentials(
    db: Session,
    full_name: str,
    email: str,
) -> tuple[Admin, str, bool]:
    temporary_password = generate_temporary_password()

    admin = Admin(
        full_name=full_name,
        email=email,
        password_hash=hash_password(temporary_password),
        must_change_password=True,
        is_active=True,
    )
    db.add(admin)
    db.flush()  # assigns admin.id without committing yet, so audit log can reference it in the same transaction

    email_sent = send_admin_credentials_email(
        to_email=email,
        full_name=full_name,
        temporary_password=temporary_password,
    )

    return admin, temporary_password, email_sent
