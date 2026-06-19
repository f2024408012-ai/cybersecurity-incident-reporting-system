from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="user"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=False
    )

    category = Column(
        String,
        nullable=False
    )

    severity = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="Open"
    )

    reported_by = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    incident_id = Column(
        Integer,
        nullable=False
    )

    action = Column(
        String,
        nullable=False
    )

    performed_by = Column(
        Integer,
        nullable=False
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(Integer, nullable=True)

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )