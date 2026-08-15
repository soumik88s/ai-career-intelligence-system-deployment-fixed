"""resume text extraction schema

Revision ID: 002_resume_text_extraction
Revises: 001_initial_schema
Create Date: 2026-08-10

"""
from alembic import op
import sqlalchemy as sa

revision = '002_resume_text_extraction'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('resumes', sa.Column('stored_filename', sa.String(length=255), server_default='', nullable=False))
    op.add_column('resumes', sa.Column('extracted_text', sa.Text(), server_default='', nullable=True))
    op.add_column('resumes', sa.Column('processing_status', sa.String(length=50), server_default='uploaded', nullable=False))
    op.add_column('resumes', sa.Column('processing_error', sa.Text(), server_default='', nullable=True))
    op.add_column('resumes', sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('resumes', 'processed_at')
    op.drop_column('resumes', 'processing_error')
    op.drop_column('resumes', 'processing_status')
    op.drop_column('resumes', 'extracted_text')
    op.drop_column('resumes', 'stored_filename')
