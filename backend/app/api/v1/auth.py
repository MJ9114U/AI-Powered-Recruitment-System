from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from ...db.session import get_db
from ...models.models import User, UserRole, Job, Application
from ...core.security import verify_password, get_password_hash, create_access_token
from .deps import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def _normalize_role(role) -> str:
    if role is None:
        return ""
    if isinstance(role, UserRole):
        return role.value
    return str(role).lower().strip()

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.APPLICANT

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user_db = db.query(User).filter(User.username == user_in.username).first()
    if user_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": new_user.id}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role if isinstance(user.role, str) else user.role.value}

@router.get("/me")
def read_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_key = _normalize_role(current_user.role)
    profile = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": role_key,
        "joined_at": current_user.created_at
    }

    if role_key == UserRole.APPLICANT.value:
        total_apps = db.query(Application).filter(Application.applicant_id == current_user.id).count()
        status_counts = db.query(Application.status, func.count(Application.id)).filter(Application.applicant_id == current_user.id).group_by(Application.status).all()
        profile.update({
            "applications_submitted": total_apps,
            "application_status_breakdown": {status: count for status, count in status_counts}
        })
    elif role_key == UserRole.HR.value:
        total_jobs = db.query(Job).filter(Job.created_by == current_user.id).count()
        total_candidates = db.query(Application).join(Job).filter(Job.created_by == current_user.id).count()
        profile.update({
            "jobs_created": total_jobs,
            "candidates_reviewed": total_candidates
        })
    elif role_key == UserRole.ADMIN.value:
        total_users = db.query(User).count()
        total_jobs = db.query(Job).count()
        total_applications = db.query(Application).count()
        profile.update({
            "total_users": total_users,
            "total_jobs": total_jobs,
            "total_applications": total_applications
        })

    return profile
