import uuid
from typing import AsyncGenerator, Optional, List, Callable
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User, UserRole

get_database_session = get_db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_database_session),
) -> User:
    """
    Extracts Bearer token from Authorization header and returns the authenticated User.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed user token")

    stmt = select(User).where(User.id == user_uuid, User.is_active.is_(True))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency generator that verifies the authenticated user has at least one of the allowed roles.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized for this operation",
            )
        return current_user

    return role_checker


def require_department_access(department_id: uuid.UUID, current_user: User) -> None:
    """
    Validates that the current user has access to the specified department.
    University Admins have global access.
    Department Chairs and Faculty can ONLY access their own department.
    """
    if current_user.role == UserRole.UNIVERSITY_ADMIN:
        return
    if current_user.department_id != department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view or manage resources in other departments",
        )
