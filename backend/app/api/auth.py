from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
import re

from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from backend.app.models.user import User
from backend.app.models.profile import UserProfile
from backend.app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Email format validation
    if not re.match(EMAIL_REGEX, payload.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Password length validation
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Duplicate email check
    existing_user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Duplicate registration: Email already registered")

    # Store hashed password
    hashed_pwd = hash_password(payload.password)
    new_user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create empty user profile
    new_profile = UserProfile(user_id=new_user.id)
    db.add(new_profile)
    db.commit()

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }

@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile": {
            "phone": profile.phone if profile else "",
            "location": profile.location if profile else "",
            "education": profile.education if profile else "",
            "experience_years": float(profile.experience_years) if profile and profile.experience_years else 0.0,
            "target_role": profile.target_role if profile else ""
        } if profile else None
    }

@router.post("/logout")
def logout_user():
    return {"message": "Successfully logged out"}
