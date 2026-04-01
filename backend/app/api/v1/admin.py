from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...db.session import get_db
from ...models.models import Application, Job, User, AuditLog, UserRole
from .deps import get_current_user, check_role

router = APIRouter(dependencies=[Depends(check_role(UserRole.ADMIN))])

@router.get("/metrics")
def get_hiring_metrics(db: Session = Depends(get_db)):
    total_apps = db.query(Application).count()
    total_jobs = db.query(Job).count()
    shortlisted = db.query(Application).filter(Application.status == "shortlisted").count()
    hired = db.query(Application).filter(Application.status == "hired").count()
    
    # Simple selection rate
    selection_rate = (hired / total_apps * 100) if total_apps > 0 else 0
    
    # Common status breakdown
    status_counts = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    
    return {
        "total_applications": total_apps,
        "total_jobs": total_jobs,
        "shortlisted": shortlisted,
        "hired": hired,
        "selection_rate": round(selection_rate, 2),
        "status_breakdown": dict(status_counts)
    }

@router.get("/logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

@router.get("/users")
def list_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()
