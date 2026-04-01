from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Text, Enum
from sqlalchemy.orm import relationship
from ..db.session import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    APPLICANT = "applicant"
    HR = "hr"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.APPLICANT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="applicant")
    jobs_created = relationship("Job", back_populates="creator")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    requirements = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="open") # open, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="jobs_created")
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    resume_path = Column(String)
    video_path = Column(String)
    scores = Column(JSON) # Store breakdown: {resume: 30, skill: 30, comm: 20, emotion: 20, total: 100}
    status = Column(String, default="pending") # pending, shortlisted, rejected, hired
    ai_feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    applicant = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
