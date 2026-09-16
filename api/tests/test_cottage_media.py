from datetime import (
    datetime,
    timedelta,
    timezone,
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import settings
from app.main import app
from app.models import (
    AuthSession,
    Cottage,
    CottageMedia,
    User,
)
from app.security import hash_session_token


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def add_cottage(
    db,
    *,
    code="C99",
    name="Automated Test Cottage",
) -> Cottage:
    cottage = Cottage(
        code=code,
        name=name,
        description=(
            "Automated cottage media test."
        ),
        capacity=None,
        base_rate=None,
        status="available",
        is_active=True,
        map_x=None,
        map_y=None,
    )

    db.add(cottage)
    db.commit()
    db.refresh(cottage)

    return cottage


def authenticated_client(
    db,
    *,
    role: str,
) -> TestClient:
    now = utc_now()

    user = User(
        username=(
            f"{role}-cottage-media-test"
        ),
        password_hash=(
            "unused-automated-test-hash"
        ),
        role=role,
        is_active=True,
        created_at=now,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    raw_token = (
        f"cottage-media-test-"
        f"{role}-{user.id}-"
        f"{now.timestamp()}"
    )

    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(
            raw_token
        ),
        expires_at=(
            now
            + timedelta(
                hours=1
            )
        ),
        created_at=now,
        revoked_at=None,
    )

    db.add(auth_session)
    db.commit()

    client = TestClient(app)

    client.cookies.set(
        settings.auth_cookie_name,
        raw_token,
        path="/",
    )

    return client


def create_media(
    client: TestClient,
    cottage_id: int,
    *,
    url: str,
    sort_order: int = 0,
    is_cover: bool = False,
    is_active: bool = True,
):
    return client.post(
        (
            f"/operator/cottages/"
            f"{cottage_id}/media"
        ),
        json={
            "media_type": "image",
            "url": url,
            "alt_text": (
                "Automated test image"
            ),
            "caption": (
                "Automated media test."
            ),
            "sort_order": sort_order,
            "is_cover": is_cover,
            "is_active": is_active,
        },
    )


@pytest.mark.parametrize(
    "role",
    [
        "owner",
        "operator",
    ],
)
def test_owner_and_operator_can_access_cottages(
    db,
    role,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role=role,
    )

    response = client.get(
        (
            f"/operator/cottages/"
            f"{cottage.id}"
        )
    )

    assert response.status_code == 200

    body = response.json()

    assert body["id"] == cottage.id
    assert body["media"] == []


def test_logged_out_user_cannot_access_operator_cottages(
    db,
):
    cottage = add_cottage(
        db
    )

    client = TestClient(app)

    response = client.get(
        (
            f"/operator/cottages/"
            f"{cottage.id}"
        )
    )

    assert response.status_code == 401


def test_staff_cannot_access_operator_cottages(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="staff",
    )

    response = client.get(
        (
            f"/operator/cottages/"
            f"{cottage.id}"
        )
    )

    assert response.status_code == 403


def test_create_media_is_visible_publicly(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    create_response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/create.jpg"
        ),
        sort_order=1,
        is_cover=True,
    )

    assert (
        create_response.status_code
        == 201
    )

    created = (
        create_response.json()
    )

    assert (
        created["cottage_id"]
        == cottage.id
    )
    assert created["is_cover"] is True
    assert created["is_active"] is True

    public_response = client.get(
        f"/cottages/{cottage.id}"
    )

    assert (
        public_response.status_code
        == 200
    )

    public_media = (
        public_response
        .json()["media"]
    )

    assert len(public_media) == 1

    assert (
        public_media[0]["id"]
        == created["id"]
    )


def test_new_cover_replaces_previous_active_cover(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    first_response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/cover-a.jpg"
        ),
        sort_order=1,
        is_cover=True,
    )

    assert (
        first_response.status_code
        == 201
    )

    first_id = (
        first_response.json()["id"]
    )

    second_response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/cover-b.jpg"
        ),
        sort_order=2,
        is_cover=True,
    )

    assert (
        second_response.status_code
        == 201
    )

    second_id = (
        second_response.json()["id"]
    )

    list_response = client.get(
        (
            f"/operator/cottages/"
            f"{cottage.id}/media"
        )
    )

    assert (
        list_response.status_code
        == 200
    )

    media_by_id = {
        item["id"]: item
        for item in list_response.json()
    }

    assert (
        media_by_id[
            first_id
        ]["is_cover"]
        is False
    )

    assert (
        media_by_id[
            second_id
        ]["is_cover"]
        is True
    )

    active_covers = [
        item
        for item in list_response.json()
        if (
            item["is_active"]
            and item["is_cover"]
        )
    ]

    assert len(active_covers) == 1


def test_media_can_be_updated(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    create_response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/update.jpg"
        ),
    )

    assert (
        create_response.status_code
        == 201
    )

    media_id = (
        create_response.json()["id"]
    )

    response = client.patch(
        (
            f"/operator/cottages/"
            f"{cottage.id}/media/"
            f"{media_id}"
        ),
        json={
            "caption": (
                "Updated caption"
            ),
            "alt_text": (
                "Updated alt text"
            ),
            "sort_order": 7,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert (
        body["caption"]
        == "Updated caption"
    )
    assert (
        body["alt_text"]
        == "Updated alt text"
    )
    assert body["sort_order"] == 7


def test_deactivated_media_is_hidden_publicly(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    create_response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/deactivate.jpg"
        ),
        is_cover=True,
    )

    assert (
        create_response.status_code
        == 201
    )

    media_id = (
        create_response.json()["id"]
    )

    delete_response = client.delete(
        (
            f"/operator/cottages/"
            f"{cottage.id}/media/"
            f"{media_id}"
        )
    )

    assert (
        delete_response.status_code
        == 204
    )

    public_response = client.get(
        f"/cottages/{cottage.id}"
    )

    assert (
        public_response.status_code
        == 200
    )

    assert (
        public_response.json()["media"]
        == []
    )

    media = db.scalar(
        select(CottageMedia)
        .where(
            CottageMedia.id
            == media_id
        )
    )

    assert media is not None
    assert media.is_active is False
    assert media.is_cover is False


def test_inactive_media_cannot_be_created_as_cover(
    db,
):
    cottage = add_cottage(
        db
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    response = create_media(
        client,
        cottage.id,
        url=(
            "/resort/cottages/"
            "_test/inactive-cover.jpg"
        ),
        is_cover=True,
        is_active=False,
    )

    assert response.status_code == 422

    assert (
        response.json()["detail"]
        == (
            "An inactive media item "
            "cannot be the cover."
        )
    )


def test_media_cannot_be_modified_through_wrong_cottage(
    db,
):
    first_cottage = add_cottage(
        db,
        code="C98",
        name="First Test Cottage",
    )

    second_cottage = add_cottage(
        db,
        code="C99",
        name="Second Test Cottage",
    )

    client = authenticated_client(
        db,
        role="operator",
    )

    create_response = create_media(
        client,
        first_cottage.id,
        url=(
            "/resort/cottages/"
            "_test/wrong-cottage.jpg"
        ),
    )

    assert (
        create_response.status_code
        == 201
    )

    media_id = (
        create_response.json()["id"]
    )

    response = client.patch(
        (
            f"/operator/cottages/"
            f"{second_cottage.id}/"
            f"media/{media_id}"
        ),
        json={
            "caption": (
                "Should not update"
            ),
        },
    )

    assert response.status_code == 404

    media = db.get(
        CottageMedia,
        media_id,
    )

    db.refresh(media)

    assert (
        media.caption
        == "Automated media test."
    )
