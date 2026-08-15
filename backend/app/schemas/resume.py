from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    stored_filename: Optional[str] = ""
    file_path: str
    file_type: str
    file_size_bytes: int
    processing_status: str
    processing_error: Optional[str] = ""
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ResumeTextResponse(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    extracted_text: str
    processing_status: str
    processing_error: Optional[str] = ""
