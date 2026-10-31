from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine

# SQLite database file path (relative to the backend directory)
DATABASE_URL = "sqlite:///database.db"

# connect_args={"check_same_thread": False} allows FastAPI request threads
# to safely share and query the SQLite database without thread-ownership errors.
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)


# Enforce foreign key constraints and enable WAL mode for high concurrency
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    # Enforce foreign key checks (disabled by default in SQLite)
    cursor.execute("PRAGMA foreign_keys=ON")
    # Write-Ahead Logging allows concurrent reads while writes take place
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


def create_db_and_tables() -> None:
    """Creates all database tables defined by SQLModel classes if they don't exist."""
    import app.models  # noqa: F401
    SQLModel.metadata.create_all(engine)
    with engine.begin() as conn:
        cursor = conn.connection.cursor()
        cols = [col[1] for col in cursor.execute("PRAGMA table_info(invoice_lines)").fetchall()]
        if cols and "price_included" not in cols:
            cursor.execute("ALTER TABLE invoice_lines ADD COLUMN price_included BOOLEAN DEFAULT 0")
        if cols and "tax_rule_id" not in cols:
            cursor.execute("ALTER TABLE invoice_lines ADD COLUMN tax_rule_id INTEGER")
        subscription_cols = [col[1] for col in cursor.execute("PRAGMA table_info(subscriptions)").fetchall()]
        if subscription_cols and "billing_anchor_day" not in subscription_cols:
            cursor.execute("ALTER TABLE subscriptions ADD COLUMN billing_anchor_day INTEGER")
        if subscription_cols:
            cursor.execute(
                "UPDATE subscriptions SET billing_anchor_day = CAST(strftime('%d', start_date) AS INTEGER) "
                "WHERE billing_anchor_day IS NULL"
            )
        cursor.execute(
            """
            UPDATE discount_rules
            SET uses = (
                SELECT COUNT(DISTINCT invoice_discount_uses.invoice_id)
                FROM invoice_discount_uses
                JOIN invoices ON invoices.id = invoice_discount_uses.invoice_id
                WHERE invoice_discount_uses.discount_rule_id = discount_rules.id
                  AND invoices.status NOT IN ('Draft', 'Cancelled')
            )
            """
        )
        cursor.close()


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request
    and guarantees it is closed when the request finishes.
    """
    with Session(engine) as session:
        yield session
