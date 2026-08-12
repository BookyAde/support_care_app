"""
The entrypoint. All this file does is create the FastAPI app, wire in CORS
(so your Next.js frontend on a different port/domain can call this API), and
register every router. No business logic lives here - that's the whole point
of the routers/services/models split.
"""

import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.core.rate_limit import limiter
from app.database import get_db
from app.routers import (
    auth,
    admins,
    clients,
    workers,
    shifts,
    visits,
    reports,
    messages,
    care_requests,
    ratings,
    contact,
)

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

# Rate limiting: `limiter` is shared (app/core/rate_limit.py) so router files
# can decorate individual routes with @limiter.limit(...) directly. No
# middleware needed - the decorator enforces the limit and raises
# RateLimitExceeded itself; this just wires the app up to catch that and
# turn it into a proper 429 response.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admins.router)
app.include_router(clients.router)
app.include_router(workers.router)
app.include_router(shifts.router)
app.include_router(visits.router)
app.include_router(reports.router)
app.include_router(messages.router)
app.include_router(care_requests.router)
app.include_router(ratings.router)
app.include_router(contact.router)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Used by uptime monitoring and the keep-alive workflow. Runs a trivial
    real query so "healthy" actually means "the app can talk to the
    database", not just "the process is running". A failed query never
    fails this endpoint itself (still 200) - the point is to report status,
    not to become another thing that can go down.
    """
    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        logger.exception("Health check database query failed")
        database_status = "unreachable"

    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": database_status,
    }
