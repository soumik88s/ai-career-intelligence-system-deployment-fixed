"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('role', sa.String(length=100), server_default='Graduate Student / Candidate'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_users_email', 'users', ['email'])

    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('phone', sa.String(length=50), server_default=''),
        sa.Column('location', sa.String(length=255), server_default=''),
        sa.Column('education', sa.String(length=255), server_default=''),
        sa.Column('experience_years', sa.Numeric(precision=4, scale=2), server_default='0.00'),
        sa.Column('target_role', sa.String(length=255), server_default=''),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_user_profiles_user_id', 'user_profiles', ['user_id'])

    op.create_table(
        'resumes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), server_default='0'),
        sa.Column('upload_status', sa.String(length=50), server_default='uploaded'),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_resumes_user_id', 'resumes', ['user_id'])

def downgrade():
    op.drop_index('idx_resumes_user_id', table_name='resumes')
    op.drop_table('resumes')
    op.drop_index('idx_user_profiles_user_id', table_name='user_profiles')
    op.drop_table('user_profiles')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
