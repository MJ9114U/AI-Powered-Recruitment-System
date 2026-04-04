from typing import Dict, List, Any
import re

from sentence_transformers import SentenceTransformer, util

class MatchingEngine:
    SKILL_MAP = {
        "ml": "machine learning",
        "ai": "artificial intelligence",
        "js": "javascript",
        "py": "python",
        "backend dev": "backend development",
        "backend developer": "backend development",
        "frontend dev": "frontend development",
        "frontend developer": "frontend development",
        "db": "database",
        "sql": "database management",
        "devops": "devops engineering",
        "reactjs": "react",
        "nodejs": "node",
    }

    SKILL_SIM_THRESHOLD = 0.70
    MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self):
        try:
            self.model = SentenceTransformer(self.MODEL_NAME)
        except Exception:
            self.model = None

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        normalized = text.lower().strip()
        normalized = re.sub(r"[\-_/\.]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized)
        return self.SKILL_MAP.get(normalized, normalized)

    def _embed_texts(self, texts: List[str]):
        if not self.model:
            return None
        return self.model.encode(texts, convert_to_tensor=True, show_progress_bar=False)

    def compute_similarity(self, jd_text: str, resume_text: str) -> float:
        if self.model and jd_text and resume_text:
            try:
                embeddings = self._embed_texts([jd_text, resume_text])
                similarity = util.cos_sim(embeddings[0], embeddings[1]).item()
                return round(float(similarity * 100), 2)
            except Exception:
                pass

        # Fallback in case embedding model is unavailable or fails
        return 0.0

    def match_skills(self, jd_requirements: List[str], candidate_skills: List[str]) -> Dict[str, Any]:
        if not jd_requirements:
            return {"matched": [], "missing": [], "skill_score": 0.0}

        jd_items = [item.strip() for item in jd_requirements if item and item.strip()]
        candidate_items = [item.strip() for item in candidate_skills if item and item.strip()]

        normalized_jd = [self._normalize_text(item) for item in jd_items]
        normalized_candidates = [self._normalize_text(item) for item in candidate_items]

        matched = []
        missing = []

        if self.model and normalized_jd and normalized_candidates:
            try:
                jd_embeddings = self._embed_texts(normalized_jd)
                cand_embeddings = self._embed_texts(normalized_candidates)

                for idx, jd_text in enumerate(normalized_jd):
                    best_match = None
                    best_score = 0.0

                    for c_idx, cand_text in enumerate(normalized_candidates):
                        if jd_text == cand_text:
                            best_match = candidate_items[c_idx]
                            best_score = 1.0
                            break

                        score = util.cos_sim(jd_embeddings[idx], cand_embeddings[c_idx]).item()
                        if score > best_score:
                            best_match = candidate_items[c_idx]
                            best_score = score

                    if best_score >= self.SKILL_SIM_THRESHOLD and best_match:
                        matched.append(best_match)
                    else:
                        missing.append(jd_items[idx])
            except Exception:
                missing = jd_items.copy()
        else:
            # fallback to exact lower-case skill matching
            lower_candidates = {item.lower(): item for item in candidate_items}
            for item in jd_items:
                if item.lower() in lower_candidates:
                    matched.append(lower_candidates[item.lower()])
                else:
                    missing.append(item)

        skill_score = len(matched) / len(jd_items) if jd_items else 0
        return {
            "matched": matched,
            "missing": missing,
            "skill_score": round(skill_score * 100, 2)
        }

matching_engine = MatchingEngine()
