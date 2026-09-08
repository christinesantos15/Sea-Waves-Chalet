from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


UserRole = Literal[
    "owner",
    "operator",
    "staff",
]

CreatableUserRole = Literal[
    "operator",
    "staff",
]


class OwnerUserCreate(BaseModel):
    username: str = Field(
        min_length=1,
        max_length=100,
    )
    password: str = Field(
        min_length=10,
        max_length=128,
    )
    role: CreatableUserRole


class OwnerUserActiveUpdate(BaseModel):
    is_active: bool


class OwnerUserPasswordReset(BaseModel):
    password: str = Field(
        min_length=10,
        max_length=128,
    )


class OwnerUserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class OwnerUserPasswordResetResponse(BaseModel):
    status: str
    user_id: int
    username: str