"""
One-off script to create the first admin account on a fresh deployment.
Run this once, interactively, so whoever is actually standing up the
deployment creates their own real admin account - nothing here is baked
into the codebase. After that, more admins can be added from inside the
app itself (Admins page, admin-only).
"""

from getpass import getpass

from app.database import SessionLocal
from app.models.admin import Admin
from app.core.security import hash_password


def create_admin(full_name: str, email: str, password: str):
    db = SessionLocal()
    try:
        existing = db.query(Admin).filter(Admin.email == email).first()
        if existing:
            print(f"Admin with email {email} already exists.")
            return

        admin = Admin(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            is_active=True,
            # Whoever runs this script chose this password themselves (it's
            # not a generated temp password relayed to someone else), so
            # there's no need to force them to change it on first login.
            must_change_password=False,
        )
        db.add(admin)
        db.commit()
        print(f"Admin created: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Create the first admin account for this deployment.\n")

    full_name = input("Full name: ").strip()
    email = input("Email: ").strip()
    password = getpass("Password: ")
    confirm_password = getpass("Confirm password: ")

    if not full_name or not email or not password:
        print("Full name, email, and password are all required. Nothing was created.")
    elif password != confirm_password:
        print("Passwords did not match. Nothing was created.")
    else:
        create_admin(full_name=full_name, email=email, password=password)
