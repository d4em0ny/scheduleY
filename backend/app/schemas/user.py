import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    full_name: str
    role: str
    department_id: Optional[uuid.UUID] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
