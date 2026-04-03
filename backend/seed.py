import sqlite3
from datetime import datetime
import json
from pathlib import Path
from backend.app.core.security import get_password_hash

# Always use backend/aris.db so seeding matches app runtime DB.
DB_PATH = Path(__file__).resolve().parent / "aris.db"

def seed_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM jobs")
    cursor.execute("DELETE FROM applications")
    cursor.execute("DELETE FROM audit_logs")

    # Add Users
    users_info = [
        (1, 'admin', 'admin@aris.ai', 'admin', 'admin'),
        (2, 'hr', 'hr@aris.ai', 'hr', 'hr'),
        (3, 'applicant', 'applicant@example.com', 'applicant', 'applicant')
    ]
    users = []
    for uid, uname, email, raw_pwd, role in users_info:
        users.append((uid, uname, email, get_password_hash(raw_pwd), role))
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)", users)

    # Add Jobs
    jobs = [
        (1, 'Senior AI Engineer', 'Looking for a Python expert with ML background.', 'Python,ML,FastAPI,SQL', 2, 'open', datetime.now()),
        (2, 'Frontend Architect', 'Experienced React developer for glassmorphic UIs.', 'React,Javascript,CSS,Vite', 2, 'open', datetime.now())
    ]
    cursor.executemany("INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?)", jobs)

    # Add Sample Application
    scores = json.dumps({
        "total_score": 88.5,
        "recommendation": "Select",
        "explanation": {
            "resume_impact": "Weighted 30% contributing 26.5 pts.",
            "skills_impact": "Weighted 30% contributing 30.0 pts.",
            "comm_impact": "Communication weighted 20% contributing 16 pts.",
            "emotion_impact": "Emotion/Confidence weighted 20% contributing 16 pts."
        }
    })
    cursor.execute("INSERT INTO applications VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", 
                  (1, 3, 1, 'resumes/sample.pdf', 'videos/sample.mp4', scores, 'shortlisted', 'Excellent technical depth.'))

    conn.commit()
    conn.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_data()
