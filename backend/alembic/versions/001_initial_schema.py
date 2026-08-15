"""Initial schema creation for DriftPulse PostgreSQL database

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-15 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('uid', sa.String(length=255), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=255), nullable=False)
    )

    # 2. Devices Table
    op.create_table(
        'devices',
        sa.Column('id', sa.String(length=255), primary_key=True),
        sa.Column('ip', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=255), nullable=False),
        sa.Column('trust_score', sa.Float(), nullable=False),
        sa.Column('drift_score', sa.Float(), nullable=False),
        sa.Column('anomaly_score', sa.Float(), nullable=False),
        sa.Column('policy', sa.String(length=255), nullable=False),
        sa.Column('risk', sa.String(length=255), nullable=False),
        sa.Column('last_seen', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('firmware', sa.String(length=255), nullable=False),
        sa.Column('uptime', sa.String(length=255), nullable=False),
        sa.Column('log_count', sa.Integer(), server_default='0'),
        sa.Column('total_bytes', sa.Float(), server_default='0.0')
    )

    # 3. Device History Table
    op.create_table(
        'device_history',
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column('timestamp', sa.String(length=255), nullable=False),
        sa.Column('trust_score', sa.Float(), nullable=False),
        sa.Column('drift_score', sa.Float(), nullable=False),
        sa.Column('anomaly_score', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('device_id', 'timestamp')
    )

    # 4. Alerts Table
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(length=255), primary_key=True),
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=255), nullable=False),
        sa.Column('severity', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=255), nullable=False),
        sa.Column('timestamp', sa.String(length=255), nullable=False),
        sa.Column('resolution_hours', sa.Float(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('alerts')
    op.drop_table('device_history')
    op.drop_table('devices')
    op.drop_table('users')
