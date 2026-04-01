from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List, Any
import numpy as np

class MatchingEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def compute_similarity(self, jd_text: str, resume_text: str) -> float:
        try:
            tfidf_matrix = self.vectorizer.fit_transform([jd_text, resume_text])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return round(float(similarity * 100), 2)
        except Exception:
            return 0.0

    def match_skills(self, jd_requirements: List[str], candidate_skills: List[str]) -> Dict[str, Any]:
        matched = [s for s in candidate_skills if s.lower() in [r.lower() for r in jd_requirements]]
        missing = [r for r in jd_requirements if r.lower() not in [s.lower() for s in candidate_skills]]
        
        match_rate = len(matched) / len(jd_requirements) if jd_requirements else 0
        return {
            "matched": matched,
            "missing": missing,
            "skill_score": round(match_rate * 100, 2)
        }

matching_engine = MatchingEngine()
