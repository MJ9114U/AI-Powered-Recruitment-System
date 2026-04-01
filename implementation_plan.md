# AI Recruitment Intelligence System (ARIS) Implementation Plan

Design and build a professional-grade AI-powered recruitment management system with three user roles (Applicant, HR, Admin), featuring automated candidate evaluation through PDF resume parsing and video/speech analysis.

## User Review Required

> [!IMPORTANT]
> **Tech Stack Selection**: I propose using **FastAPI** for the backend and **React (Vite)** for the frontend to ensure a premium, SaaS-like user experience. While Streamlit is an option, React allows for the "wow" factor and complex multi-role dashboards requested.
> 
> **AI Model Handling**: Some models (DeepFace, Whisper) can be resource-heavy. I will implement them as modular services. For the initial setup, I will provide full logic with fallback/mock modes to ensure the system is runnable on standard hardware while maintaining production-ready structure.

## Proposed Changes

### 1. Backend Architecture (FastAPI)

#### [NEW] Backend Structure
- `backend/app/main.py`: Entry point and middleware.
- `backend/app/api/v1/`: Role-based endpoints (`auth.py`, `applicant.py`, `hr.py`, `admin.py`).
- `backend/app/services/`:
  - `resume_engine.py`: PDF extraction (PyMuPDF) + NLP (spaCy).
  - `video_engine.py`: Speech-to-text (Whisper) + Emotion analysis.
  - `matching_engine.py`: Semantic similarity (SentenceTransformers/TF-IDF).
  - `scoring_engine.py`: Weighted calculation logic.
- `backend/app/models/`: Database schemas for Users, Job Postings, Applications, and Audit Logs.
- `backend/app/core/`: JWT Authentication and Role-Based Access Control (RBAC).

---

### 2. Frontend Architecture (React + Vite)

#### [NEW] Frontend Structure
- **Design System**: Use a custom premium CSS theme with high-fidelity components (charts, glassmorphism).
- **Portals**:
  - `ApplicantPortal`: Resume upload, Video recording interface, Feedback view.
  - `HRPortal`: Pipeline management, Candidate ranking, Explainable AI dashboard.
  - `AdminPortal`: System health, Engagement metrics, Decision overrides.

---

### 3. Database Schema (PostgreSQL/SQLite)

#### [NEW] Data Models
- **Users**: ID, Username, Email, Password (hashed), Role (APPLICANT, HR, ADMIN).
- **Jobs**: Title, Description, Requirements, CreatedBy, Status.
- **Applications**: CandidateID, JobID, ResumeURL, VideoURL, Scores (JSON), Status.
- **AuditLogs**: UserID, Action, Timestamp, IP.

---

### 4. Advanced Features
- **AI Interview Questions**: Generated based on extracted skills from the resume.
- **Explainable AI (XAI)**: Breakdown of scores (e.g., "High score due to specific Python experience, but moderate communication score").
- **Bias Detection**: Basic analysis to flagging potential language bias in job descriptions vs resumes.

## Open Questions

1. **AI Model Hosting**: Should I integrate real-time ML inference (requires large downloads like spaCy models, Whisper weights) or provide a "Simulation Mode" first that demonstrates the logic without 2GB+ downloads?
2. **Video Uploads**: For the demo, should I support real recording in the browser or just file uploads?

## Verification Plan

### Automated Tests
- Run `pytest` for backend API endpoints and scoring logic.
- Validate JWT role isolation (Applicant cannot access Admin endpoints).

### Manual Verification
- Walk through the full journey:
  1. Login as Admin to create an HR account.
  2. Login as HR to post a Job.
  3. Login as Applicant to upload resume and video.
  4. Login as HR to view the AI-ranked candidate list and XAI panel.
