from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "scheduleY - University Intelligent Scheduling System"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "scheduley"
    POSTGRES_PASSWORD: str = "scheduley_password"
    POSTGRES_DB: str = "scheduley_db"
    DATABASE_URL: Optional[str] = None

    # Academic & Scheduling Policy Defaults
    DEFAULT_MAX_WEEKLY_WORKLOAD: float = 12.0
    DEFAULT_INTERDEPT_HOLD_HOURS: int = 72
    DEFAULT_SLOT_DURATION_MINUTES: int = 60
    DEFAULT_WORKING_DAYS: int = 5
    DEFAULT_SLOTS_PER_DAY: int = 8

    # Security
    SECRET_KEY: str = "development-secret-key-change-in-production-scheduley"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def get_database_url(self, is_async: bool = True) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        driver = "postgresql+asyncpg" if is_async else "postgresql"
        return f"{driver}://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()

