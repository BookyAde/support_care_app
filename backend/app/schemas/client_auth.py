from pydantic import BaseModel, EmailStr


class ClientLoginRequest(BaseModel):
    """
    Supports both login options in a single schema, mirroring WorkerLoginRequest:
    - Option 1: access_code + password
    - Option 2: email + password
    Exactly one of access_code / email must be provided - validated in the route,
    since Pydantic v2 conditional-required-field validation is more verbose than
    just checking it directly in the service function.
    """
    access_code: str | None = None
    email: EmailStr | None = None
    password: str
