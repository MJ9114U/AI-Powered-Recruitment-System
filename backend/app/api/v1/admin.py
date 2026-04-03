from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...db.session import get_db
from ...models.models import Application, Job, User, AuditLog, UserRole
from .deps import check_role

router = APIRouter(dependencies=[Depends(check_role(UserRole.ADMIN))])

def _status_breakdown(db: Session) -> dict:
    rows = db.query(Application.status, func.count(Application.id)).group_by(Application.status).all()
    out = {}
    for row in rows:
        key = str(row[0] if row[0] is not None else "unknown")
        out[key] = int(row[1])
    return out

@router.get("/metrics")
def get_hiring_metrics(db: Session = Depends(get_db)):
    total_apps = db.query(Application).count()
    total_jobs = db.query(Job).count()
    total_users = db.query(User).count()
    shortlisted = db.query(Application).filter(Application.status == "shortlisted").count()
    hired = db.query(Application).filter(Application.status == "hired").count()
    pending = db.query(Application).filter(Application.status == "pending").count()
    rejected = db.query(Application).filter(Application.status == "rejected").count()

    selection_rate = (hired / total_apps * 100) if total_apps > 0 else 0
    status_breakdown = _status_breakdown(db)

    role_rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    users_by_role = {}
    for row in role_rows:
        key = str(row[0] if row[0] is not None else "unknown").lower()
        users_by_role[key] = int(row[1])

    return {
        "total_applications": total_apps,
        "total_jobs": total_jobs,
        "total_users": total_users,
        "shortlisted": shortlisted,
        "hired": hired,
        "pending": pending,
        "rejected": rejected,
        "selection_rate": round(selection_rate, 2),
        "status_breakdown": status_breakdown,
        "users_by_role": users_by_role,
    }

@router.get("/logs")
def get_audit_logs(db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "action": r.action or "",
            "details": r.details or "",
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in rows
    ]

@router.get("/users")
def list_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/hr-recruiters")
def list_hr_recruiters(db: Session = Depends(get_db)):
    """Recruiter accounts with live counts for the admin HR activity panel."""
    recruiters = (
        db.query(User)
        .filter(func.lower(User.role) == UserRole.HR.value)
        .order_by(User.username)
        .all()
    )
    result = []
    for u in recruiters:
        my_job_ids = [jid for (jid,) in db.query(Job.id).filter(Job.created_by == u.id).all()]
        jobs_posted = len(my_job_ids)
        pipeline = (
            db.query(Application).filter(Application.job_id.in_(my_job_ids)).count()
            if my_job_ids
            else 0
        )
        latest_job = (
            db.query(Job)
            .filter(Job.created_by == u.id)
            .order_by(Job.created_at.desc())
            .first()
        )
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "jobs_posted": jobs_posted,
            "candidates_in_pipeline": pipeline,
            "latest_job_title": latest_job.title if latest_job else None,
            "last_posted_at": latest_job.created_at.isoformat() if latest_job and latest_job.created_at else None,
            "member_since": u.created_at.isoformat() if u.created_at else None,
        })
    return result
