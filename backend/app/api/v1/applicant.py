from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
import os, uuid
from ...db.session import get_db
from ...models.models import Application, Job, User
from .deps import get_current_user, check_role, UserRole
from ...services.resume_engine import resume_engine
from ...services.matching_engine import matching_engine
from ...services.video_engine import video_engine
from ...services.scoring_engine import scoring_engine

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[3].parent
UPLOAD_DIR = BASE_DIR / "data" / "resumes"
VIDEO_DIR = BASE_DIR / "data" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/apply/{job_id}")
async def apply_job(
    job_id: int,
    resume: UploadFile = File(...),
    video: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Save resume file
    resume_ext = resume.filename.split(".")[-1]
    resume_filename = f"{uuid.uuid4()}.{resume_ext}"
    resume_path = UPLOAD_DIR / resume_filename
    with open(resume_path, "wb") as f:
        f.write(await resume.read())

    video_path = None
    if video is not None:
        video_ext = video.filename.split(".")[-1]
        video_filename = f"{uuid.uuid4()}.{video_ext}"
        video_path = VIDEO_DIR / video_filename
        with open(video_path, "wb") as f:
            f.write(await video.read())

    # --- AI Analysis Pipeline ---
    # 1. Resume Analysis
    resume_data = resume_engine.analyze_resume(str(resume_path))
    
    # 2. Skill Matching
    jd_requirements = job.requirements.split(",") # Assume comma-separated for demo
    match_data = matching_engine.match_skills(jd_requirements, resume_data.get("skills", []))
    
    # 3. Video Analysis (Simulated)
    if video_path:
        video_data = video_engine.analyze_video(str(video_path))
    else:
        video_data = {"clarity": 0, "confidence": 0}

    # 4. Scoring Engine
    scores_breakdown = scoring_engine.calculate_final_score(
        resume_score=matching_engine.compute_similarity(job.description, resume_data.get("raw_text_preview", "")),
        skill_score=match_data.get("skill_score", 0),
        comm_score=video_data.get("clarity", 0),
        emotion_score=video_data.get("confidence", 0)
    )

    # Create Application
    feedback_parts = [f"Strengths: {', '.join(match_data['matched'][:3])}", f"Gaps: {', '.join(match_data['missing'][:3])}"]
    if not video_path:
        feedback_parts.append("Video not uploaded; your application will be evaluated on resume and skills only.")

    new_app = Application(
        applicant_id=current_user.id,
        job_id=job_id,
        resume_path=str(resume_path),
        video_path=str(video_path) if video_path else None,
        scores=scores_breakdown,
        status="pending",
        ai_feedback=". ".join(feedback_parts)
    )
    db.add(new_app)
    db.commit()
    return {"message": "Application submitted", "application_id": new_app.id, "analysis": scores_breakdown}

@router.get("/status")
def get_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    apps = db.query(Application).filter(Application.applicant_id == current_user.id).all()
    # Simple formatting
    formatted = []
    for a in apps:
        formatted.append({
            "id": a.id,
            "job_title": a.job.title,
            "status": a.status,
            "score": a.scores.get("total_score"),
            "recommendation": a.scores.get("recommendation"),
            "feedback": a.ai_feedback,
            "created_at": a.created_at
        })
    return formatted
