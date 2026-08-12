"""
Database connection setup.

Why this file exists:
SQLAlchemy needs three things to work: an `engine` (the actual connection to Postgres),
a `SessionLocal` factory (creates a new conversation with the DB per request), and a
`Base` class (every model inherits from this so SQLAlchemy knows what tables to create).

The `get_db()` function below is a FastAPI "dependency" - it hands each request its own
database session and guarantees the session is closed afterward, even if the request
crashes. Without this pattern, you'd leak open database connections over time.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # checks connection is alive before using it - avoids "stale connection" errors
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session and always closes it afterward.
    Usage in a route: `db: Session = Depends(get_db)`
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
