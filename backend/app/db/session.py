from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import os

# Database connection URL
# Default to SQLite in the backend folder for predictable local setup.
backend_dir = Path(__file__).resolve().parents[2]
default_db_path = backend_dir / "aris.db"
default_db_url = f"sqlite:///{default_db_path.as_posix()}"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", default_db_url)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
