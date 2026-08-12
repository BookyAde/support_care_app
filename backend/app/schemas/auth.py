"""
Pydantic schemas = the "shape" of data going in and out of the API. Keeping these
separate from SQLAlchemy models is deliberate: a model has fields like
`password_hash` that should NEVER be sent back in an API response. Schemas let us
control exactly what's exposed, in each direction, per endpoint.
"""

from uuid import UUID
from pydantic import BaseModel, EmailStr


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class WorkerLoginRequest(BaseModel):
    """
    Supports both login options from the spec in a single schema:
    - Option 1: employee_id + password
    - Option 2: email + password
    Exactly one of employee_id / email must be provided - validated in the route,
    since Pydantic v2 conditional-required-field validation is more verbose than
    just checking it directly in the service function.
    """
    employee_id: str | None = None
    email: EmailStr | None = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TermsAcceptanceRequest(BaseModel):
    terms_version: str
