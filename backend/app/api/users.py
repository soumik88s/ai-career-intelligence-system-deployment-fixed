from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User
from backend.app.models.profile import UserProfile
from backend.app.schemas.profile import UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/users", tags=["User Profiles"])

def get_current_user_from_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.location is not None:
        profile.location = payload.location
    if payload.education is not None:
        profile.education = payload.education
    if payload.experience_years is not None:
        profile.experience_years = payload.experience_years
    if payload.target_role is not None:
        profile.target_role = payload.target_role

    db.commit()
    db.refresh(profile)
    return profile
