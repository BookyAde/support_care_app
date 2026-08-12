"""
This is where the dual-login decision we discussed actually gets implemented:
a worker can log in with EITHER employee_id+password OR email+password, and
both resolve against the same `workers` table.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.worker import Worker
from app.models.client import Client
from app.core.security import verify_password


def authenticate_admin(db: Session, email: str, password: str) -> Admin:
    admin = db.query(Admin).filter(Admin.email == email).first()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is inactive")
    return admin


def authenticate_worker(
    db: Session,
    password: str,
    employee_id: str | None = None,
    email: str | None = None,
) -> Worker:
    if not employee_id and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either employee_id or email to log in",
        )

    query = db.query(Worker)
    worker = (
        query.filter(Worker.employee_id == employee_id).first()
        if employee_id
        else query.filter(Worker.email == email).first()
    )

    if not worker or not verify_password(password, worker.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Note: we check is_active here (login-time check) AND again in
    # get_current_worker (every-request check). Login-time gives a clear
    # "account deactivated" message at the point of login; the dependency
    # check catches the case where an admin deactivates the account mid-session.
    if not worker.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")

    return worker


def authenticate_client(
    db: Session,
    password: str,
    access_code: str | None = None,
    email: str | None = None,
) -> Client:
    if not access_code and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either access_code or email to log in",
        )

    query = db.query(Client)
    client = (
        query.filter(Client.access_code == access_code).first()
        if access_code
        else query.filter(Client.email == email).first()
    )

    if not client or not verify_password(password, client.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Note: we check is_active here (login-time check) AND again in
    # get_current_client (every-request check). Login-time gives a clear
    # "account deactivated" message at the point of login; the dependency
    # check catches the case where an admin deactivates the account mid-session.
    if not client.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")

    return client
