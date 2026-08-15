from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4
import os
import shutil
from datetime import datetime

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User
from backend.app.models.resume import Resume
from backend.app.schemas.resume import ResumeResponse, ResumeTextResponse
from backend.app.services.resume_parser import parse_resume

router = APIRouter(prefix="/resumes", tags=["Resumes"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def get_current_user_from_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account not found")
    return user

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    # Validate extension and content type
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    allowed_exts = ["pdf", "docx", "txt"]
    allowed_mimes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain"
    ]
    
    if ext not in allowed_exts or file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '.{ext}'. Only PDF (.pdf) and DOCX (.docx) documents are supported."
        )
        
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )
        
    stored_uuid = str(uuid4())
    stored_filename = f"{stored_uuid}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    
    # Save file safely
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    # Extract text using parser
    try:
        parsed_result = parse_resume(file_bytes, file.filename, file.content_type)
        extracted_text = parsed_result.get("extracted_text", "")
        warning = parsed_result.get("warning")
        processing_status = "completed"
        processing_error = warning if warning else ""
    except Exception as e:
        extracted_text = ""
        processing_status = "failed"
        processing_error = str(e)
        
    new_resume = Resume(
        id=UUID(stored_uuid),
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_type=file.content_type or f"application/{ext}",
        file_size_bytes=len(file_bytes),
        extracted_text=extracted_text,
        processing_status=processing_status,
        processing_error=processing_error,
        processed_at=datetime.utcnow()
    )
    
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    return new_resume

@router.get("", response_model=List[ResumeResponse])
def list_user_resumes(
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    # IDOR Protection: filter strictly by current_user.id
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume_by_id(
    resume_id: UUID,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    # IDOR Protection: filter strictly by resume_id AND current_user.id
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or access denied")
    return resume

@router.get("/{resume_id}/text", response_model=ResumeTextResponse)
def get_resume_extracted_text(
    resume_id: UUID,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    # IDOR Protection
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or access denied")
        
    return ResumeTextResponse(
        id=resume.id,
        user_id=resume.user_id,
        original_filename=resume.original_filename,
        extracted_text=resume.extracted_text or "",
        processing_status=resume.processing_status,
        processing_error=resume.processing_error
    )

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user_from_header),
    db: Session = Depends(get_db)
):
    # IDOR Protection: Ensure resume belongs to current_user
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if str(resume.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden: You can only delete your own resume")
    
    # Remove file from disk
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass
            
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted successfully"}
