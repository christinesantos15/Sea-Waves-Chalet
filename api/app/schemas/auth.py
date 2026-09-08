from datetime import datetime
from typing import Literal

from pydantic import BaseModel


UserRole = Literal[
    "owner",
    "operator",
    "staff",
]


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime


class LogoutResponse(BaseModel):
    status: str