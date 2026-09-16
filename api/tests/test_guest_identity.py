import threading
import time

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import engine
from app.models import Guest
from app.services.guest_identity import (
    find_reusable_guest,
    get_or_create_guest,
    normalize_email,
    normalize_phone,
)


def add_guest(
    db,
    *,
    full_name="Test Guest",
    phone=None,
    email=None,
    facebook_name=None,
    messenger_psid=None,
):
    guest = Guest(
        full_name=full_name,
        phone=phone,
        email=email,
        facebook_name=facebook_name,
        messenger_psid=messenger_psid,
        notes="Automated test guest.",
    )

    db.add(guest)
    db.commit()
    db.refresh(guest)

    return guest


def test_phone_normalization():
    assert (
        normalize_phone(
            "0999-111-2233"
        )
        == "09991112233"
    )

    assert (
        normalize_phone(
            "(0999) 111 2233"
        )
        == "09991112233"
    )


def test_email_normalization():
    assert (
        normalize_email(
            "  TEST@Example.COM  "
        )
        == "test@example.com"
    )


def test_phone_alone_does_not_reuse(
    db,
):
    add_guest(
        db,
        phone="0999-111-2233",
        email="person@example.com",
    )

    reusable = find_reusable_guest(
        db,
        phone="09991112233",
    )

    assert reusable is None


def test_email_alone_does_not_reuse(
    db,
):
    add_guest(
        db,
        phone="09991112233",
        email="PERSON@example.com",
    )

    reusable = find_reusable_guest(
        db,
        email="person@example.com",
    )

    assert reusable is None


def test_phone_and_email_reuse_unique_guest(
    db,
):
    existing = add_guest(
        db,
        phone="0999-111-2233",
        email="PERSON@example.com",
    )

    reusable = find_reusable_guest(
        db,
        phone="09991112233",
        email="person@example.com",
    )

    assert reusable is not None
    assert reusable.id == existing.id


def test_ambiguous_phone_and_email_do_not_guess(
    db,
):
    add_guest(
        db,
        full_name="Duplicate One",
        phone="0999-111-2233",
        email="duplicate@example.com",
    )

    add_guest(
        db,
        full_name="Duplicate Two",
        phone="09991112233",
        email="DUPLICATE@example.com",
    )

    reusable = find_reusable_guest(
        db,
        phone="09991112233",
        email="duplicate@example.com",
    )

    assert reusable is None


def test_messenger_psid_reuses_guest(
    db,
):
    existing = add_guest(
        db,
        messenger_psid=(
            "PSID-TEST-001"
        ),
    )

    reusable = find_reusable_guest(
        db,
        messenger_psid=(
            " PSID-TEST-001 "
        ),
    )

    assert reusable is not None
    assert reusable.id == existing.id


def test_reuse_fills_missing_contact_information(
    db,
):
    existing = add_guest(
        db,
        full_name="Messenger Guest",
        messenger_psid=(
            "PSID-ENRICH-001"
        ),
    )

    guest, created = (
        get_or_create_guest(
            db,
            full_name=(
                "Messenger Guest"
            ),
            phone="09995556666",
            email=(
                "messenger@example.com"
            ),
            facebook_name=(
                "Messenger User"
            ),
            messenger_psid=(
                "PSID-ENRICH-001"
            ),
            creation_note=(
                "Should not create."
            ),
        )
    )

    db.commit()
    db.refresh(guest)

    assert created is False
    assert guest.id == existing.id

    assert (
        guest.phone
        == "09995556666"
    )

    assert (
        guest.email
        == "messenger@example.com"
    )

    assert (
        guest.facebook_name
        == "Messenger User"
    )


def test_reuse_does_not_overwrite_existing_contacts(
    db,
):
    existing = add_guest(
        db,
        full_name="Existing Guest",
        phone="09111111111",
        email="original@example.com",
        facebook_name=(
            "Original Facebook"
        ),
        messenger_psid=(
            "PSID-PRESERVE-001"
        ),
    )

    guest, created = (
        get_or_create_guest(
            db,
            full_name=(
                "Different Name"
            ),
            phone="09222222222",
            email="different@example.com",
            facebook_name=(
                "Different Facebook"
            ),
            messenger_psid=(
                "PSID-PRESERVE-001"
            ),
            creation_note=(
                "Should not create."
            ),
        )
    )

    db.commit()
    db.refresh(guest)

    assert created is False
    assert guest.id == existing.id

    assert (
        guest.phone
        == "09111111111"
    )

    assert (
        guest.email
        == "original@example.com"
    )

    assert (
        guest.facebook_name
        == "Original Facebook"
    )


def run_concurrent_identity_requests(
    *,
    phone=None,
    email=None,
    messenger_psid=None,
):
    barrier = threading.Barrier(2)

    results = []
    errors = []

    result_lock = threading.Lock()

    def worker(number):
        session = Session(engine)

        try:
            barrier.wait()

            guest, created = (
                get_or_create_guest(
                    session,
                    full_name=(
                        "Concurrent Guest"
                    ),
                    phone=phone,
                    email=email,
                    messenger_psid=(
                        messenger_psid
                    ),
                    creation_note=(
                        "Concurrency test."
                    ),
                )
            )

            guest_id = guest.id

            if created:
                time.sleep(0.25)

            session.commit()

            with result_lock:
                results.append(
                    (
                        number,
                        guest_id,
                        created,
                    )
                )

        except Exception as exc:
            session.rollback()

            with result_lock:
                errors.append(
                    (
                        number,
                        repr(exc),
                    )
                )

        finally:
            session.close()

    threads = [
        threading.Thread(
            target=worker,
            args=(1,),
        ),
        threading.Thread(
            target=worker,
            args=(2,),
        ),
    ]

    for thread in threads:
        thread.start()

    for thread in threads:
        thread.join()

    return results, errors


def test_concurrent_phone_email_requests_create_one_guest():
    results, errors = (
        run_concurrent_identity_requests(
            phone="09993334455",
            email=(
                "concurrent@example.com"
            ),
        )
    )

    assert errors == []
    assert len(results) == 2

    guest_ids = {
        guest_id
        for (
            _number,
            guest_id,
            _created,
        )
        in results
    }

    created_count = sum(
        1
        for (
            _number,
            _guest_id,
            created,
        )
        in results
        if created
    )

    assert len(guest_ids) == 1
    assert created_count == 1

    with Session(engine) as db:
        count = db.scalar(
            select(
                func.count(
                    Guest.id
                )
            ).where(
                Guest.email
                == "concurrent@example.com"
            )
        )

    assert count == 1


def test_concurrent_psid_requests_create_one_guest():
    results, errors = (
        run_concurrent_identity_requests(
            messenger_psid=(
                "PSID-CONCURRENT-001"
            ),
        )
    )

    assert errors == []
    assert len(results) == 2

    guest_ids = {
        guest_id
        for (
            _number,
            guest_id,
            _created,
        )
        in results
    }

    created_count = sum(
        1
        for (
            _number,
            _guest_id,
            created,
        )
        in results
        if created
    )

    assert len(guest_ids) == 1
    assert created_count == 1

    with Session(engine) as db:
        count = db.scalar(
            select(
                func.count(
                    Guest.id
                )
            ).where(
                Guest.messenger_psid
                == "PSID-CONCURRENT-001"
            )
        )

    assert count == 1


def test_name_and_facebook_alone_do_not_reuse(
    db,
):
    existing = add_guest(
        db,
        full_name="Same Person Name",
        facebook_name=(
            "Same Facebook Name"
        ),
    )

    guest, created = (
        get_or_create_guest(
            db,
            full_name=(
                "Same Person Name"
            ),
            facebook_name=(
                "Same Facebook Name"
            ),
            creation_note=(
                "Second name-only guest."
            ),
        )
    )

    db.commit()

    assert created is True
    assert guest.id != existing.id

    count = db.scalar(
        select(
            func.count(
                Guest.id
            )
        )
    )

    assert count == 2
