from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.database import get_db
from app.core.security import create_access_token, verify_password, hash_password
from app.core.dependencies import get_current_admin, get_current_worker, get_current_client
from app.core.rate_limit import limiter
from app.services.auth_service import authenticate_admin, authenticate_worker, authenticate_client
from app.services.audit_service import log_action
from app.models.worker_terms import WorkerTermsAcceptance
from app.models.client_terms import ClientTermsAcceptance
from app.schemas.auth import (
    AdminLoginRequest,
    WorkerLoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    TermsAcceptanceRequest,
)
from app.schemas.client_auth import ClientLoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def admin_login(request: Request, payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, payload.email, payload.password)
    token = create_access_token(subject=str(admin.id), role="admin")
    return TokenResponse(access_token=token, must_change_password=admin.must_change_password)


@router.post("/admin/change-password", status_code=status.HTTP_204_NO_CONTENT)
def admin_change_password(
    payload: ChangePasswordRequest,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    admin.password_hash = hash_password(payload.new_password)
    admin.must_change_password = False
    db.add(admin)
    db.commit()


@router.post("/worker/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def worker_login(request: Request, payload: WorkerLoginRequest, db: Session = Depends(get_db)):
    worker = authenticate_worker(
        db, password=payload.password, employee_id=payload.employee_id, email=payload.email
    )
    token = create_access_token(subject=str(worker.id), role="worker")
    return TokenResponse(access_token=token, must_change_password=worker.must_change_password)


@router.post("/worker/change-password", status_code=status.HTTP_204_NO_CONTENT)
def worker_change_password(
    payload: ChangePasswordRequest,
    worker=Depends(get_current_worker),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, worker.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    worker.password_hash = hash_password(payload.new_password)
    worker.must_change_password = False
    db.add(worker)
    db.commit()


@router.post("/worker/accept-terms", status_code=status.HTTP_204_NO_CONTENT)
def worker_accept_terms(
    payload: TermsAcceptanceRequest,
    worker=Depends(get_current_worker),
    db: Session = Depends(get_db),
):
    """
    Called right after the forced password change, per the flow you and Olajide
    agreed on. `ip_address` isn't captured here yet since it depends on how the
    frontend/proxy passes the client IP through - we'll wire that up when we get
    to deployment/networking.
    """
    acceptance = WorkerTermsAcceptance(worker_id=worker.id, terms_version=payload.terms_version)
    db.add(acceptance)

    log_action(
        db,
        actor_id=worker.id,
        actor_type="worker",
        action="terms_accepted",
        entity_type="worker",
        entity_id=worker.id,
        details={"terms_version": payload.terms_version},
    )
    db.commit()


@router.post("/client/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def client_login(request: Request, payload: ClientLoginRequest, db: Session = Depends(get_db)):
    client = authenticate_client(
        db, password=payload.password, access_code=payload.access_code, email=payload.email
    )
    token = create_access_token(subject=str(client.id), role="client")
    return TokenResponse(access_token=token, must_change_password=client.must_change_password)


@router.post("/client/change-password", status_code=status.HTTP_204_NO_CONTENT)
def client_change_password(
    payload: ChangePasswordRequest,
    client=Depends(get_current_client),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, client.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    client.password_hash = hash_password(payload.new_password)
    client.must_change_password = False
    db.add(client)
    db.commit()


@router.post("/client/accept-terms", status_code=status.HTTP_204_NO_CONTENT)
def client_accept_terms(
    payload: TermsAcceptanceRequest,
    client=Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """
    Called right after the forced password change, mirroring the worker flow.
    `ip_address` isn't captured here yet since it depends on how the
    frontend/proxy passes the client IP through - we'll wire that up when we get
    to deployment/networking.
    """
    acceptance = ClientTermsAcceptance(client_id=client.id, terms_version=payload.terms_version)
    db.add(acceptance)

    log_action(
        db,
        actor_id=client.id,
        actor_type="client",
        action="terms_accepted",
        entity_type="client",
        entity_id=client.id,
        details={"terms_version": payload.terms_version},
    )
    db.commit()
