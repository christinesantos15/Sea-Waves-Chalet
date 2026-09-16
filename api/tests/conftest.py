import os
from pathlib import Path

import pytest
from dotenv import dotenv_values
from sqlalchemy.engine import make_url


REPO_ROOT = (
    Path(__file__)
    .resolve()
    .parents[2]
)

ENV_FILE = REPO_ROOT / ".env"


def build_test_database_url() -> str:
    explicit_test_url = os.getenv(
        "TEST_DATABASE_URL"
    )

    if explicit_test_url:
        url = make_url(
            explicit_test_url
        )
    else:
        env_values = dotenv_values(
            ENV_FILE
        )

        development_url = (
            env_values.get(
                "DATABASE_URL"
            )
        )

        if not development_url:
            raise RuntimeError(
                "DATABASE_URL was not found "
                "in the project .env file."
            )

        url = make_url(
            development_url
        ).set(
            database="sea_waves_test"
        )

    if url.database != "sea_waves_test":
        raise RuntimeError(
            "Refusing to run tests against "
            f"database {url.database!r}. "
            "Tests may only use "
            "'sea_waves_test'."
        )

    return url.render_as_string(
        hide_password=False
    )


TEST_DATABASE_URL = (
    build_test_database_url()
)

# These must be set before importing
# app.config / app.database.
os.environ["DATABASE_URL"] = (
    TEST_DATABASE_URL
)

os.environ["ENVIRONMENT"] = "test"


from app.database import (  # noqa: E402
    Base,
    SessionLocal,
    engine,
)

# Importing app.models ensures all
# SQLAlchemy tables are registered
# on Base.metadata.
import app.models  # noqa: E402, F401


@pytest.fixture(
    scope="session",
    autouse=True,
)
def test_database_schema():
    database_name = (
        engine.url.database
    )

    if database_name != "sea_waves_test":
        raise RuntimeError(
            "Safety check failed: "
            "pytest is not connected to "
            "sea_waves_test."
        )

    Base.metadata.drop_all(
        bind=engine
    )

    Base.metadata.create_all(
        bind=engine
    )

    yield

    Base.metadata.drop_all(
        bind=engine
    )


@pytest.fixture(autouse=True)
def clean_test_database():
    with SessionLocal() as db:
        for table in reversed(
            Base.metadata.sorted_tables
        ):
            db.execute(
                table.delete()
            )

        db.commit()

    yield

    with SessionLocal() as db:
        for table in reversed(
            Base.metadata.sorted_tables
        ):
            db.execute(
                table.delete()
            )

        db.commit()


@pytest.fixture
def db():
    session = SessionLocal()

    try:
        yield session
    finally:
        session.rollback()
        session.close()
