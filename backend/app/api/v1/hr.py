from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...db.session import get_db
from ...models.models import Job, Application, User, UserRole
from .deps import get_current_user, check_role
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(dependencies=[Depends(check_role(UserRole.HR))])

class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str # comma-separated

@router.post("/jobs")
def create_job(job_in: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_job = Job(
        title=job_in.title,
        description=job_in.description,
        requirements=job_in.requirements,
        created_by=current_user.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/jobs")
def list_my_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Job).filter(Job.created_by == current_user.id).order_by(Job.created_at.desc()).all()

@router.get("/summary")
def hr_activity_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Aggregates across this HR user's job postings for dashboard monitoring."""
    jobs_posted = db.query(Job).filter(Job.created_by == current_user.id).count()
    my_job_ids = [jid for (jid,) in db.query(Job.id).filter(Job.created_by == current_user.id).all()]
    if not my_job_ids:
        return {
            "jobs_posted": 0,
            "total_applications": 0,
            "pending_review": 0,
            "shortlisted": 0,
            "rejected": 0,
            "hired": 0,
            "status_breakdown": {},
        }
    status_rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.job_id.in_(my_job_ids))
        .group_by(Application.status)
        .all()
    )
    status_breakdown = {str(s or "unknown"): int(c) for s, c in status_rows}
    total_applications = sum(status_breakdown.values())
    return {
        "jobs_posted": jobs_posted,
        "total_applications": total_applications,
        "pending_review": status_breakdown.get("pending", 0),
        "shortlisted": status_breakdown.get("shortlisted", 0),
        "rejected": status_breakdown.get("rejected", 0),
        "hired": status_breakdown.get("hired", 0),
        "status_breakdown": status_breakdown,
    }

@router.get("/applications/{job_id}")
def view_ranked_applicants(job_id: int, db: Session = Depends(get_db)):
    # Fetch all applications for a job and rank them by scores.total_score
    apps = db.query(Application).filter(Application.job_id == job_id).all()

    def _total_score(app: Application) -> float:
        s = app.scores
        if not s or not isinstance(s, dict):
            return 0.0
        v = s.get("total_score", 0)
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    sorted_apps = sorted(apps, key=_total_score, reverse=True)
    
    # Format for HR
    formatted = []
    for a in sorted_apps:
        formatted.append({
            "id": a.id,
            "candidate_name": a.applicant.username,
            "email": a.applicant.email,
            "resume_path": a.resume_path,
            "video_path": a.video_path,
            "scores": a.scores,
            "status": a.status,
            "created_at": a.created_at
        })
    return formatted

@router.patch("/applications/{application_id}/status")
def update_app_status(application_id: int, status: str, db: Session = Depends(get_db)):
    app_to_update = db.query(Application).filter(Application.id == application_id).first()
    if not app_to_update:
        raise HTTPException(status_code=404, detail="Application not found")
    app_to_update.status = status
    db.commit()
    return {"message": "Status updated"}
