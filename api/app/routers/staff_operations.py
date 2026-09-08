from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Cottage,
    HousekeepingTask,
    MaintenanceIssue,
    Room,
)
from app.schemas.staff_operations import (
    HousekeepingTaskCreate,
    HousekeepingTaskResponse,
    HousekeepingTaskStatusUpdate,
    MaintenanceIssueCreate,
    MaintenanceIssueResponse,
    MaintenanceIssueStatusUpdate,
)

from app.dependencies.auth import (
    require_roles,
)

router = APIRouter(
    prefix="/staff",
    tags=["staff operations"],
    dependencies=[
        Depends(
            require_roles(
                "owner",
                "operator",
                "staff",
            )
        )
    ],
)

HOUSEKEEPING_STATUSES = (
    "open",
    "in_progress",
    "completed",
)

MAINTENANCE_STATUSES = (
    "open",
    "in_progress",
    "resolved",
)

ROOM_HOUSEKEEPING_STATUSES = (
    "available",
    "needs_cleaning",
    "cleaning",
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_cottage_or_404(
    db: Session,
    cottage_id: int,
) -> Cottage:
    cottage = db.get(
        Cottage,
        cottage_id,
    )

    if cottage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cottage not found.",
        )

    return cottage


def get_room_or_404(
    db: Session,
    room_id: int,
) -> Room:
    room = db.get(
        Room,
        room_id,
    )

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found.",
        )

    return room


def resolve_housekeeping_location(
    db: Session,
    cottage_id: int | None,
    room_id: int | None,
) -> tuple[
    Cottage | None,
    Room | None,
    int | None,
]:
    cottage = None
    room = None
    resolved_cottage_id = cottage_id

    if cottage_id is not None:
        cottage = get_cottage_or_404(
            db,
            cottage_id,
        )

    if room_id is not None:
        room = get_room_or_404(
            db,
            room_id,
        )

        if (
            cottage_id is not None
            and room.cottage_id
            != cottage_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Room does not belong "
                    "to the selected cottage."
                ),
            )

        resolved_cottage_id = (
            room.cottage_id
        )

        if cottage is None:
            cottage = get_cottage_or_404(
                db,
                room.cottage_id,
            )

    return (
        cottage,
        room,
        resolved_cottage_id,
    )


def build_housekeeping_response(
    task: HousekeepingTask,
    cottage: Cottage | None,
    room: Room | None,
) -> HousekeepingTaskResponse:
    return HousekeepingTaskResponse(
        id=task.id,
        cottage_id=task.cottage_id,
        cottage_code=(
            cottage.code
            if cottage is not None
            else None
        ),
        cottage_name=(
            cottage.name
            if cottage is not None
            else None
        ),
        room_id=task.room_id,
        room_code=(
            room.code
            if room is not None
            else None
        ),
        room_name=(
            room.name
            if room is not None
            else None
        ),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        assigned_to=task.assigned_to,
        due_at=task.due_at,
        completed_at=task.completed_at,
        created_at=task.created_at,
    )


def build_maintenance_response(
    issue: MaintenanceIssue,
    cottage: Cottage | None,
) -> MaintenanceIssueResponse:
    return MaintenanceIssueResponse(
        id=issue.id,
        cottage_id=issue.cottage_id,
        cottage_code=(
            cottage.code
            if cottage is not None
            else None
        ),
        cottage_name=(
            cottage.name
            if cottage is not None
            else None
        ),
        location=issue.location,
        title=issue.title,
        description=issue.description,
        priority=issue.priority,
        status=issue.status,
        reported_by=issue.reported_by,
        created_at=issue.created_at,
        resolved_at=issue.resolved_at,
    )


def sync_room_readiness(
    db: Session,
    room: Room,
) -> None:
    if (
        room.status
        not in ROOM_HOUSEKEEPING_STATUSES
    ):
        return

    active_statuses = set(
        db.scalars(
            select(
                HousekeepingTask.status
            ).where(
                HousekeepingTask.room_id
                == room.id,
                HousekeepingTask.status.in_(
                    (
                        "open",
                        "in_progress",
                    )
                ),
            )
        ).all()
    )

    if "in_progress" in active_statuses:
        room.status = "cleaning"
        return

    if "open" in active_statuses:
        room.status = "needs_cleaning"
        return

    room.status = "available"


@router.get(
    "/housekeeping",
    response_model=list[
        HousekeepingTaskResponse
    ],
)
def get_housekeeping_tasks(
    task_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
) -> list[HousekeepingTaskResponse]:
    if (
        task_status is not None
        and task_status
        not in HOUSEKEEPING_STATUSES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid housekeeping status."
            ),
        )

    statement = (
        select(
            HousekeepingTask,
            Cottage,
            Room,
        )
        .outerjoin(
            Cottage,
            Cottage.id
            == HousekeepingTask.cottage_id,
        )
        .outerjoin(
            Room,
            Room.id
            == HousekeepingTask.room_id,
        )
    )

    if task_status is not None:
        statement = statement.where(
            HousekeepingTask.status
            == task_status,
        )

    statement = statement.order_by(
        HousekeepingTask.created_at.desc(),
        HousekeepingTask.id.desc(),
    )

    rows = db.execute(
        statement
    ).all()

    return [
        build_housekeeping_response(
            task,
            cottage,
            room,
        )
        for (
            task,
            cottage,
            room,
        ) in rows
    ]


@router.post(
    "/housekeeping",
    response_model=HousekeepingTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_housekeeping_task(
    data: HousekeepingTaskCreate,
    db: Session = Depends(get_db),
) -> HousekeepingTaskResponse:
    try:
        (
            cottage,
            room,
            resolved_cottage_id,
        ) = resolve_housekeeping_location(
            db,
            data.cottage_id,
            data.room_id,
        )

        task = HousekeepingTask(
            cottage_id=resolved_cottage_id,
            room_id=data.room_id,
            title=data.title.strip(),
            description=data.description,
            status="open",
            priority=data.priority,
            assigned_to=data.assigned_to,
            due_at=data.due_at,
            completed_at=None,
            created_at=utc_now(),
        )

        db.add(task)

        db.flush()

        if room is not None:
            sync_room_readiness(
                db,
                room,
            )

        db.commit()
        db.refresh(task)

        return build_housekeeping_response(
            task,
            cottage,
            room,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/housekeeping/{task_id}/status",
    response_model=HousekeepingTaskResponse,
)
def update_housekeeping_status(
    task_id: int,
    data: HousekeepingTaskStatusUpdate,
    db: Session = Depends(get_db),
) -> HousekeepingTaskResponse:
    try:
        task = db.scalar(
            select(HousekeepingTask)
            .where(
                HousekeepingTask.id
                == task_id,
            )
            .with_for_update()
        )

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Housekeeping task not found."
                ),
            )

        task.status = data.status

        if data.status == "completed":
            task.completed_at = utc_now()
        else:
            task.completed_at = None

        cottage = None
        room = None

        if task.cottage_id is not None:
            cottage = db.get(
                Cottage,
                task.cottage_id,
            )

        if task.room_id is not None:
            room = db.scalar(
                select(Room)
                .where(
                    Room.id
                    == task.room_id,
                )
                .with_for_update()
            )

        db.flush()

        if room is not None:
            sync_room_readiness(
                db,
                room,
            )

        db.commit()
        db.refresh(task)

        return build_housekeeping_response(
            task,
            cottage,
            room,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.get(
    "/maintenance",
    response_model=list[
        MaintenanceIssueResponse
    ],
)
def get_maintenance_issues(
    issue_status: str | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
) -> list[MaintenanceIssueResponse]:
    if (
        issue_status is not None
        and issue_status
        not in MAINTENANCE_STATUSES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid maintenance status."
            ),
        )

    statement = (
        select(
            MaintenanceIssue,
            Cottage,
        )
        .outerjoin(
            Cottage,
            Cottage.id
            == MaintenanceIssue.cottage_id,
        )
    )

    if issue_status is not None:
        statement = statement.where(
            MaintenanceIssue.status
            == issue_status,
        )

    statement = statement.order_by(
        MaintenanceIssue.created_at.desc(),
        MaintenanceIssue.id.desc(),
    )

    rows = db.execute(
        statement
    ).all()

    return [
        build_maintenance_response(
            issue,
            cottage,
        )
        for issue, cottage in rows
    ]


@router.post(
    "/maintenance",
    response_model=MaintenanceIssueResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_maintenance_issue(
    data: MaintenanceIssueCreate,
    db: Session = Depends(get_db),
) -> MaintenanceIssueResponse:
    try:
        cottage = None

        if data.cottage_id is not None:
            cottage = get_cottage_or_404(
                db,
                data.cottage_id,
            )

        issue = MaintenanceIssue(
            cottage_id=data.cottage_id,
            location=data.location,
            title=data.title.strip(),
            description=data.description,
            priority=data.priority,
            status="open",
            reported_by=data.reported_by,
            created_at=utc_now(),
            resolved_at=None,
        )

        db.add(issue)
        db.commit()
        db.refresh(issue)

        return build_maintenance_response(
            issue,
            cottage,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/maintenance/{issue_id}/status",
    response_model=MaintenanceIssueResponse,
)
def update_maintenance_status(
    issue_id: int,
    data: MaintenanceIssueStatusUpdate,
    db: Session = Depends(get_db),
) -> MaintenanceIssueResponse:
    try:
        issue = db.scalar(
            select(MaintenanceIssue)
            .where(
                MaintenanceIssue.id
                == issue_id,
            )
            .with_for_update()
        )

        if issue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "Maintenance issue not found."
                ),
            )

        issue.status = data.status

        if data.status == "resolved":
            issue.resolved_at = utc_now()
        else:
            issue.resolved_at = None

        cottage = None

        if issue.cottage_id is not None:
            cottage = db.get(
                Cottage,
                issue.cottage_id,
            )

        db.commit()
        db.refresh(issue)

        return build_maintenance_response(
            issue,
            cottage,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise