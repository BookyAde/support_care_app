"""
Central configuration for the app.

Why this file exists:
Every setting that changes between environments (local dev, staging, production)
lives here and is loaded from environment variables. This means we NEVER hardcode
secrets like database URLs or JWT keys directly in code - they live in a `.env`
file (which is git-ignored) and get loaded at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database ---
    # This will be your Supabase Postgres connection string, e.g.:
    # postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
    DATABASE_URL: str

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours
    FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN: bool = True

    # --- Email (for auto-generated worker credentials) ---
    RESEND_API_KEY: str = ""
    EMAIL_FROM_ADDRESS: str = "no-reply@supportcare.app"

    # --- Frontend URLs (for login links/CTAs in emails) ---
    # Three separate Next.js apps on three separate origins - local dev ports
    # by default, must be updated to the real subdomains once deployed:
    # admin-app -> https://bssupport.care (root domain)
    # worker-app -> https://app.bssupport.care
    # client-app -> https://portal.bssupport.care
    ADMIN_APP_URL: str = "http://localhost:3000"
    WORKER_APP_URL: str = "http://localhost:3001"
    CLIENT_APP_URL: str = "http://localhost:3002"

    # --- App ---
    APP_NAME: str = "Support Care Management API"
    ENVIRONMENT: str = "development"  # development | staging | production
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Single shared settings instance, imported everywhere else in the app
settings = Settings()
