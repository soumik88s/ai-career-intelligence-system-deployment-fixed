from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class UserProfileBase(BaseModel):
    phone: Optional[str] = ""
    location: Optional[str] = ""
    education: Optional[str] = ""
    experience_years: Optional[float] = 0.0
    target_role: Optional[str] = ""

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
