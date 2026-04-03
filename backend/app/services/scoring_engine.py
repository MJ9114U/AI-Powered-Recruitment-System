from typing import Dict, Any, Tuple

class ScoringEngine:
    def __init__(self):
        # Weights when a video is present (must sum to 1.0)
        self.weights = {
            "resume": 0.30,
            "skill_match": 0.30,
            "communication": 0.20,
            "emotion_confidence": 0.20,
        }

    def _effective_weights(self, has_video: bool) -> Tuple[Dict[str, float], str]:
        """
        With video: all four signals count (resume, skills, communication, emotion).

        Without video: only resume + skill matching count (0% communication/emotion).
        Uses a fixed 40% / 60% split so the total differs from the with-video path when
        resume similarity and skill overlap are not equal — and differs from older 50/50
        resume-only runs after code updates.
        """
        w = self.weights
        if has_video:
            return (
                {
                    "resume": w["resume"],
                    "skill_match": w["skill_match"],
                    "communication": w["communication"],
                    "emotion_confidence": w["emotion_confidence"],
                },
                "full",
            )

        # No video: explicit weights (sum to 1.0); emphasize JD skill overlap vs text similarity
        NO_VIDEO_RESUME = 0.40
        NO_VIDEO_SKILLS = 0.60
        return (
            {
                "resume": NO_VIDEO_RESUME,
                "skill_match": NO_VIDEO_SKILLS,
                "communication": 0.0,
                "emotion_confidence": 0.0,
            },
            "resume_skills_only",
        )

    def calculate_final_score(
        self,
        resume_score: float,
        skill_score: float,
        comm_score: float,
        emotion_score: float,
        has_video: bool = True,
    ) -> Dict[str, Any]:
        """
        Weighted total. No video → 40% resume similarity + 60% skill match (no video factors).
        """
        eff, mode = self._effective_weights(has_video)
        total = (
            resume_score * eff["resume"]
            + skill_score * eff["skill_match"]
            + comm_score * eff["communication"]
            + emotion_score * eff["emotion_confidence"]
        )
        total = round(total, 2)

        recommendation = "Reject"
        if total >= 80:
            recommendation = "Select"
        elif total >= 60:
            recommendation = "Hold"

        def pct(x: float) -> int:
            return int(round(x * 100))

        explanation = {
            "resume_impact": f"Weighted {pct(eff['resume'])}% contributing {round(resume_score * eff['resume'], 2)} pts.",
            "skills_impact": f"Weighted {pct(eff['skill_match'])}% contributing {round(skill_score * eff['skill_match'], 2)} pts.",
            "comm_impact": (
                f"Communication weighted {pct(eff['communication'])}% contributing {round(comm_score * eff['communication'], 2)} pts."
                if has_video
                else "Excluded — no video; scoring is resume + skills only."
            ),
            "emotion_impact": (
                f"Emotion/Confidence weighted {pct(eff['emotion_confidence'])}% contributing {round(emotion_score * eff['emotion_confidence'], 2)} pts."
                if has_video
                else "Excluded — no video; scoring is resume + skills only."
            ),
        }

        return {
            "total_score": total,
            "recommendation": recommendation,
            "explanation": explanation,
            "scoring_mode": mode,
            "weights_applied": eff,
            "breakdown": {
                "resume": resume_score,
                "skills": skill_score,
                "communication": comm_score if has_video else None,
                "emotion": emotion_score if has_video else None,
            },
        }

scoring_engine = ScoringEngine()
