from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db

# Re-export get_db for FastAPI dependency injection
get_database_session = get_db

