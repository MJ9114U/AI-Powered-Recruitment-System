from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...db.session import get_db
from ...models.models import Job, Application, User, UserRole, AuditLog
from .deps import get_current_user, check_role
from pydantic import BaseModel
from typing import List, Optional
import json

from ...services.resume_engine import resume_engine
from ...services.matching_engine import matching_engine
from ...services.scoring_engine import scoring_engine

router = APIRouter(dependencies=[Depends(check_role(UserRole.HR))])

class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str # comma-separated

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None

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
    db.add(AuditLog(
        user_id=current_user.id,
        action="JOB_CREATED",
        details=f"Job {new_job.title} created"
    ))
    db.commit()
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
def update_app_status(application_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app_to_update = db.query(Application).filter(Application.id == application_id).first()
    if not app_to_update:
        raise HTTPException(status_code=404, detail="Application not found")
    app_to_update.status = status
    db.add(AuditLog(
        user_id=current_user.id,
        action="APPLICATION_STATUS_UPDATED",
        details=f"Application {application_id} status changed to {status}"
    ))
    db.commit()
    return {"message": "Status updated"}

@router.patch("/jobs/{job_id}")
def update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job_to_update = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job_to_update:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    needs_recalc = False
    if job_in.title is not None and job_in.title != job_to_update.title:
        job_to_update.title = job_in.title
    if job_in.description is not None and job_in.description != job_to_update.description:
        job_to_update.description = job_in.description
        needs_recalc = True
    if job_in.requirements is not None and job_in.requirements != job_to_update.requirements:
        job_to_update.requirements = job_in.requirements
        needs_recalc = True
        
    db.commit()
    db.refresh(job_to_update)
    
    if needs_recalc:
        apps = db.query(Application).filter(Application.job_id == job_id).all()
        jd_requirements = job_to_update.requirements.split(",") if job_to_update.requirements else []
        
        for app in apps:
            if not app.resume_path:
                continue
                
            # Extract fresh text/skills
            resume_data = resume_engine.analyze_resume(app.resume_path)
            
            # Re-evaluate
            match_data = matching_engine.match_skills(jd_requirements, resume_data.get("skills", []))
            resume_score = matching_engine.compute_similarity(job_to_update.description, resume_data.get("raw_text_preview", ""))
            
            old_scores = app.scores
            if isinstance(old_scores, str):
                try:
                    old_scores = json.loads(old_scores)
                except Exception:
                    old_scores = {}
            if not isinstance(old_scores, dict):
                old_scores = {}
                
            breakdown = old_scores.get("breakdown") or {}
            has_video = (app.video_path is not None)
            comm_score = breakdown.get("communication", 0) if breakdown.get("communication") is not None else 0
            emotion_score = breakdown.get("emotion", 0) if breakdown.get("emotion") is not None else 0
            
            new_scores_breakdown = scoring_engine.calculate_final_score(
                resume_score=resume_score,
                skill_score=match_data.get("skill_score", 0),
                comm_score=comm_score,
                emotion_score=emotion_score,
                has_video=has_video,
            )
            
            feedback_parts = [f"Strengths: {', '.join(match_data['matched'][:3])}", f"Gaps: {', '.join(match_data['missing'][:3])}"]
            if not has_video:
                feedback_parts.append("Video not uploaded; your application will be evaluated on resume and skills only.")
                
            app.scores = new_scores_breakdown
            app.ai_feedback = ". ".join(feedback_parts)
            
        db.commit()
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="JOB_UPDATED",
        details=f"Job {job_id} updated"
    ))
    db.commit()   
    return job_to_update

@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job_to_delete = db.query(Job).filter(Job.id == job_id, Job.created_by == current_user.id).first()
    if not job_to_delete:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    # Optional: Delete associated applications, or test cascading depending on models.
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    for app in apps:
        db.delete(app)
        
    db.delete(job_to_delete)
    db.add(AuditLog(
        user_id=current_user.id,
        action="JOB_DELETED",
        details=f"Job {job_id} deleted"
    ))
    db.commit()
    return {"message": "Job deleted successfully"}
