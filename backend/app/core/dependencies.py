"""
Reusable FastAPI dependencies for protecting routes.

Why two separate dependencies (get_current_admin / get_current_worker) instead of
one generic "get_current_user": it makes route protection self-documenting and
impossible to misuse. A route that depends on `get_current_admin` CANNOT be
accessed with a worker's token, and the code makes that obvious just by reading
the function signature - no need to check role manually inside every route body.
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.models.admin import Admin
from app.models.worker import Worker
from app.models.client import Client

http_bearer_scheme = HTTPBearer()

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None or payload.get("role") != "admin":
        raise CREDENTIALS_EXCEPTION

    admin = db.query(Admin).filter(Admin.id == UUID(payload["sub"])).first()
    if admin is None or not admin.is_active:  # type: ignore
        raise CREDENTIALS_EXCEPTION
    return admin


def get_current_worker(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    db: Session = Depends(get_db),
) -> Worker:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None or payload.get("role") != "worker":
        raise CREDENTIALS_EXCEPTION

    worker = db.query(Worker).filter(Worker.id == UUID(payload["sub"])).first()
    if worker is None:
        raise CREDENTIALS_EXCEPTION

    # Critical security check: an admin can deactivate a worker instantly, and
    # that must take effect even if the worker still holds a valid, unexpired
    # JWT. Without this check, a deactivated worker could keep working until
    # their token naturally expires.
    if not worker.is_active:  # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")

    return worker


def get_current_client(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    db: Session = Depends(get_db),
) -> Client:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None or payload.get("role") != "client":
        raise CREDENTIALS_EXCEPTION

    client = db.query(Client).filter(Client.id == UUID(payload["sub"])).first()
    if client is None:
        raise CREDENTIALS_EXCEPTION

    # Critical security check: an admin can deactivate a client instantly, and
    # that must take effect even if the client still holds a valid, unexpired
    # JWT. Without this check, a deactivated client could keep accessing the
    # app until their token naturally expires.
    if not client.is_active:  # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")

    return client


ACTOR_MODELS: dict[str, type] = {"admin": Admin, "worker": Worker, "client": Client}


def get_current_actor(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer_scheme),
    db: Session = Depends(get_db),
) -> tuple[UUID, str]:
    """
    For endpoints any of the three roles can call - e.g. editing/deleting a
    message you sent, where the caller could legitimately be an admin, worker,
    or client - decodes the token directly and returns (actor_id, actor_type)
    instead of forcing three separate role-specific dependencies.

    Re-queries the relevant table and checks is_active, same as
    get_current_admin/worker/client above: without this, a deactivated worker
    or client (or admin) could keep editing/deleting their own messages until
    their token naturally expired, even though every other endpoint they touch
    would already be locking them out.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None or payload.get("role") not in ACTOR_MODELS:
        raise CREDENTIALS_EXCEPTION

    actor_id = UUID(payload["sub"])
    actor_type = payload["role"]

    model = ACTOR_MODELS[actor_type]
    actor = db.query(model).filter(model.id == actor_id).first()
    if actor is None:
        raise CREDENTIALS_EXCEPTION
    if not actor.is_active:  # type: ignore
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated")

    return actor_id, actor_type