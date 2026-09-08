from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Sea Waves Chalet API"
    environment: str = "development"

    database_url: str
    frontend_url: str = "http://localhost:3000"

    auth_cookie_name: str = "sea_waves_session"
    auth_session_hours: int = 12
    auth_cookie_secure: bool = False

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()