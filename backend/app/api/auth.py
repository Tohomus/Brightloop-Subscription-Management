from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import (
    validate_password_strength,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.models.auth import User, UserRole
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    PasswordResetRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    """Dependency that extracts and verifies the authenticated user from the Bearer token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required."
        )
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, session: Session = Depends(get_session)):
    """
    Registers a new user account.
    Enforces PDF specs:
    - Unique email
    - Password > 8 chars, 1 uppercase, 1 lowercase, 1 special character
    """
    # 1. Enforce password complexity
    validate_password_strength(payload.password)

    # 2. Check email uniqueness
    statement = select(User).where(User.email == payload.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # 3. Hash password and persist
    hashed_pwd = hash_password(payload.password)
    user = User(
        email=payload.email,
        password_hash=hashed_pwd,
        role=payload.role or UserRole.CUSTOMER
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, session: Session = Depends(get_session)):
    """
    Authenticates a user and returns a signed JWT access token with role claims.
    """
    statement = select(User).where(User.email == payload.email)
    user = session.exec(statement).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Issue token encoding user id, email, and role
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
    )


@router.post("/reset-password")
def request_password_reset(payload: PasswordResetRequest, session: Session = Depends(get_session)):
    """
    Simulates sending a password reset link to the registered email.
    """
    statement = select(User).where(User.email == payload.email)
    user = session.exec(statement).first()

    if not user:
        # Avoid user enumeration in production; return success message regardless
        return {"message": f"If an account exists for {payload.email}, a reset link has been dispatched."}

    # Generate temporary mock reset token
    reset_token = create_access_token(
        data={"sub": str(user.id), "action": "password_reset"}
    )
    return {
        "message": f"Reset link dispatched to {payload.email}.",
        "reset_token_preview": reset_token  # Provided for easy local testing in demo
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the currently authenticated user's profile."""
    return current_user
