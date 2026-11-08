import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_database_session, get_current_user
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserLogin, UserRead, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    session: AsyncSession = Depends(get_database_session),
):
    stmt = select(User).where(User.username == payload.username.strip())
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    user_read = UserRead(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department_id=user.department_id,
        department_code=user.department.code if user.department else None,
        department_name=user.department.name if user.department else None,
    )

    return TokenResponse(access_token=access_token, token_type="bearer", user=user_read)


@router.get("/me", response_model=UserRead)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserRead(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        department_id=current_user.department_id,
        department_code=current_user.department.code if current_user.department else None,
        department_name=current_user.department.name if current_user.department else None,
    )


@router.get("/demo-users", response_model=List[UserRead])
async def list_demo_users(session: AsyncSession = Depends(get_database_session)):
    stmt = select(User).where(User.is_active.is_(True)).order_by(User.role, User.username)
    result = await session.execute(stmt)
    users = result.scalars().all()
    return [
        UserRead(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            department_id=u.department_id,
            department_code=u.department.code if u.department else None,
            department_name=u.department.name if u.department else None,
        )
        for u in users
    ]
