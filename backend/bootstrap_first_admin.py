"""
One-off bootstrap script: creates the very first admin account after a
database wipe, using create_admin_with_credentials() - the exact same
credential-generation flow POST /admins uses - rather than reimplementing
any part of it.

Unlike create_admin.py (interactive - the person running it types their own
name/email/password directly), this is hardcoded to bootstrap one specific
account non-interactively: create_admin_with_credentials() always generates
a random temporary password and emails it, forcing must_change_password=True,
exactly like every other admin created through POST /admins.

Run directly from backend/:
    python bootstrap_first_admin.py
"""

from app.database import SessionLocal
from app.services.admin_service import create_admin_with_credentials

FULL_NAME = "Alabi Winner"
EMAIL = "alabiwinner9@gmail.com"


def main():
    db = SessionLocal()
    try:
        admin, temporary_password, email_sent = create_admin_with_credentials(
            db, full_name=FULL_NAME, email=EMAIL
        )
        db.commit()
        db.refresh(admin)

        print(f"Admin created: {admin.email} (id={admin.id})")
        print(f"Email sent: {email_sent}")
        if not email_sent:
            print(
                "WARNING: the credentials email did not send. The temporary "
                "password is intentionally not printed here - without the "
                "email, this admin has no known password yet."
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
