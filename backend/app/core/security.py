"""
Two separate jobs live here: (1) hashing/verifying passwords, (2) creating and
reading JWT tokens.

Why bcrypt for passwords: bcrypt is deliberately SLOW (it's designed that way).
Fast hashing algorithms like MD5/SHA256 are actually BAD for passwords because
they let an attacker try billions of guesses per second if your database ever
leaks. bcrypt limits that to a few thousand guesses per second, making brute
force impractical.

Why JWT for sessions: a JWT is a signed token the server can verify without a
database lookup on every request. This matters a lot for a mobile worker app -
the phone can hold a token and prove "I'm Worker X" instantly, and it transfers
cleanly to a future native app since JWT isn't tied to browser cookies.
"""

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, role: str, extra_claims: dict | None = None) -> str:
    """
    `subject` = the user's id (admin or worker), `role` = "admin" or "worker".
    We embed `role` directly in the token so every protected route can check
    permissions WITHOUT a database round-trip - just decode and read the claim.
    """
    to_encode = {
        "sub": subject,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
