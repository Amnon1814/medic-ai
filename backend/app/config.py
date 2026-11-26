from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):

    database_url: str = "sqlite:///./medic.db"

    # Require a strong secret key from the environment
    secret_key: str = Field(min_length=32)

    anthropic_api_key: str = ""
    gemini_api_key: str = ""

    llm_model: str = "claude-sonnet-4-5"

    # Token expires after 60 minutes
    token_minutes: int = Field(default=60, ge=5, le=1440)

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()