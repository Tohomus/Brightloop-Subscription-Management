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
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per request
    and guarantees it is closed when the request finishes.
    """
    with Session(engine) as session:
        yield session
