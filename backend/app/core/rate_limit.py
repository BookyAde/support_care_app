"""
Shared slowapi rate limiter instance.

Why this lives in its own file instead of directly in main.py: router files
(auth.py, care_requests.py, contact.py) need to import the same `limiter`
instance to decorate individual routes with @limiter.limit(...), and
importing it from main.py would create a circular import (main.py already
imports those routers to register them). Defining it once here, with no
dependency on main.py, breaks that cycle.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
