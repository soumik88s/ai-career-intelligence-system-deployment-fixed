import uuid
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), default="", nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    extracted_text = Column(Text, default="")
    processing_status = Column(String(50), default="uploaded")
    processing_error = Column(Text, default="")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="resumes")
