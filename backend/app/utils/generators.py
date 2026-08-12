"""
Generates the company-issued Employee ID and a temporary password when an admin
creates a new worker. Kept as pure functions (no DB access) so they're easy to
test in isolation.
"""

import secrets
import string


def generate_employee_id(prefix: str = "SC") -> str:
    """
    Produces something like 'SC-4821'. The uniqueness check against the database
    happens in the calling service (worker_service.py), which retries if there's
    a collision - collisions are extremely rare with a 4-digit random suffix but
    not impossible, so we don't assume uniqueness here.
    """
    number = secrets.randbelow(9000) + 1000  # 4-digit number, 1000-9999
    return f"{prefix}-{number}"


def generate_client_access_code(prefix: str = "CLT") -> str:
    """
    Produces something like 'CLT-4821'. Same shape as generate_employee_id, just a
    different prefix so client and worker codes are visually distinguishable. The
    uniqueness check against the database happens in the calling service
    (client_auth_service.py), which retries if there's a collision.
    """
    number = secrets.randbelow(9000) + 1000  # 4-digit number, 1000-9999
    return f"{prefix}-{number}"


def generate_temporary_password(length: int = 10) -> str:
    """
    Generates a random password that's easy enough to read/type manually
    (avoids ambiguous characters like 0/O, 1/l) since this may be relayed
    verbally or via SMS in addition to email.
    """
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))
