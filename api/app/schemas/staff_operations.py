from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


HousekeepingStatus = Literal[
    "open",
    "in_progress",
    "completed",
]

MaintenanceStatus = Literal[
    "open",
    "in_progress",
    "resolved",
]

TaskPriority = Literal[
    "low",
    "normal",
    "high",
    "urgent",
]


class HousekeepingTaskCreate(BaseModel):
    cottage_id: int | None = None
    room_id: int | None = None

    title: str = Field(
        min_length=1,
        max_length=150,
    )

    description: str | None = None

    priority: TaskPriority = "normal"

    assigned_to: str | None = Field(
        default=None,
        max_length=150,
    )

    due_at: datetime | None = None


class HousekeepingTaskStatusUpdate(BaseModel):
    status: HousekeepingStatus


class HousekeepingTaskResponse(BaseModel):
    id: int

    cottage_id: int | None
    cottage_code: str | None
    cottage_name: str | None

    room_id: int | None
    room_code: str | None
    room_name: str | None

    title: str
    description: str | None

    status: str
    priority: str

    assigned_to: str | None

    due_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class MaintenanceIssueCreate(BaseModel):
    cottage_id: int | None = None

    location: str | None = Field(
        default=None,
        max_length=150,
    )

    title: str = Field(
        min_length=1,
        max_length=150,
    )

    description: str | None = None

    priority: TaskPriority = "normal"

    reported_by: str | None = Field(
        default=None,
        max_length=150,
    )


class MaintenanceIssueStatusUpdate(BaseModel):
    status: MaintenanceStatus


class MaintenanceIssueResponse(BaseModel):
    id: int

    cottage_id: int | None
    cottage_code: str | None
    cottage_name: str | None

    location: str | None

    title: str
    description: str | None

    priority: str
    status: str

    reported_by: str | None

    created_at: datetime
    resolved_at: datetime | None