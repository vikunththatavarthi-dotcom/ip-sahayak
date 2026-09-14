"""
core/database.py — Async SQLAlchemy engine + session factory for SQLite.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False, "timeout": 30},
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


async def init_db() -> None:
    """Create tables and apply the small additive SQLite migrations we need."""
    # Import models so they register with Base.metadata
    from app.models import db as _  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # ``create_all`` does not add columns to an existing SQLite database.
        # These additive migrations preserve records created by earlier builds.
        for table, column, definition in (
            ("sources", "domain", "VARCHAR(32) NOT NULL DEFAULT 'general'"),
            ("sources", "jurisdiction", "VARCHAR(64) NOT NULL DEFAULT 'india'"),
            ("conversations", "domain", "VARCHAR(32) NOT NULL DEFAULT 'general_ip'"),
        ):
            rows = await conn.exec_driver_sql(f"PRAGMA table_info({table})")
            columns = {row[1] for row in rows.fetchall()}
            if column not in columns:
                await conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context-manager form of the session — useful in scripts."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
