from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    return db.query(Job).filter(Job.created_by == current_user.id).all()

@router.get("/applications/{job_id}")
def view_ranked_applicants(job_id: int, db: Session = Depends(get_db)):
    # Fetch all applications for a job and rank them by scores.total_score
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    # Sort by total_score descending
    sorted_apps = sorted(apps, key=lambda x: x.scores.get("total_score", 0), reverse=True)
    
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
