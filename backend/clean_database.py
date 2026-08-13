"""
DANGER - deliberately destructive, manual-use-only script.

Wipes every row from every table in this database, in foreign-key-safe
order, while leaving the schema itself completely intact - every table,
index, and Alembic's migration history stay exactly as they are. This is
purely a "empty every table" reset, meant to be run ONCE, by a human,
deliberately - e.g. to clear out test/seed data before real production use
begins. It is not wired into any app code path and nothing imports it.

Run directly from backend/:
    python clean_database.py

Requires typing the exact phrase "DELETE ALL DATA" to proceed. Anything
else - including empty input - aborts immediately with zero changes made.
"""

import re
import sys

from sqlalchemy import text

from app.config import settings
from app.database import engine

CONFIRMATION_PHRASE = "DELETE ALL DATA"

# Children-before-parents order, verified against the actual current models
# in app/models/ (not assumed from memory) - every table with a NOT NULL
# foreign key is deleted before the table it points to:
#   visit_notes    -> visits              (visit_id NOT NULL)
#   visits         -> shifts              (shift_id NOT NULL)
#   ratings        -> shifts/clients/workers (all three NOT NULL)
#   shifts         -> clients/workers     (both NOT NULL; created_by_admin_id nullable)
#   worker_terms_acceptance -> workers    (worker_id NOT NULL)
#   client_terms_acceptance -> clients    (client_id NOT NULL)
# Everything else (messages, admin_thread_reads, care_requests, and the
# admin/worker/client "created_by"/"reviewed_by" links) is a NULLABLE
# foreign key, so their relative order doesn't matter for correctness - they
# just need to come out before the workers/clients/admins rows they point
# to. audit_logs and contact_messages have no foreign keys at all.
TABLES_IN_DELETE_ORDER = [
    "visit_notes",
    "visits",
    "ratings",
    "messages",
    "admin_thread_reads",
    "worker_terms_acceptance",
    "client_terms_acceptance",
    "audit_logs",
    "contact_messages",
    "care_requests",
    "shifts",
    "workers",
    "clients",
    "admins",
]


def masked_database_url() -> str:
    """
    Show only the host/database portion so whoever runs this can visually
    confirm which database they're about to wipe - credentials are fully
    redacted rather than printed to a terminal, where they could linger in
    scrollback, a screen-share, or a copy-pasted bug report.
    """
    match = re.match(r"^(?P<scheme>[\w+]+)://(?P<creds>[^@]+)@(?P<rest>.+)$", settings.DATABASE_URL)
    if not match:
        # Doesn't match the scheme://user:pass@host/db shape (e.g. a bare
        # sqlite path) - nothing credential-shaped to redact.
        return settings.DATABASE_URL
    return f"{match.group('scheme')}://[REDACTED]@{match.group('rest')}"


def main() -> None:
    print("=" * 70)
    print("DANGER: this will permanently delete ALL DATA from ALL TABLES")
    print("in the database below. The schema itself is left untouched -")
    print("every table, index, and Alembic's migration history stay intact.")
    print("=" * 70)
    print()
    print(f"Target database: {masked_database_url()}")
    print()

    typed = input(f'Type "{CONFIRMATION_PHRASE}" to proceed, anything else aborts: ')
    if typed != CONFIRMATION_PHRASE:
        print("Aborted. No changes were made.")
        sys.exit(0)

    print()
    print("Confirmed. Deleting all rows...")
    print()

    counts: dict[str, int] = {}

    try:
        # engine.begin() opens a single transaction for the whole block and
        # commits automatically only if every statement inside succeeds - if
        # anything raises partway through, it rolls back automatically
        # before the exception propagates, so this is genuinely all-or-
        # nothing with no extra bookkeeping needed.
        with engine.begin() as conn:
            for table in TABLES_IN_DELETE_ORDER:
                result = conn.execute(text(f"DELETE FROM {table}"))
                counts[table] = result.rowcount
    except Exception as exc:
        print(f"FAILED partway through: {exc}")
        print("Transaction rolled back - no rows were actually deleted.")
        sys.exit(1)

    print("Done. Rows deleted per table:")
    print()
    total = 0
    for table in TABLES_IN_DELETE_ORDER:
        deleted = counts[table]
        total += deleted
        print(f"  {table:<28} {deleted}")
    print()
    print(f"  {'TOTAL':<28} {total}")
    print()
    print("Schema and alembic_version were not touched - only data was removed.")


if __name__ == "__main__":
    main()
