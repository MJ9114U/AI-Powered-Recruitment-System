from typing import Dict, Any, List

class ScoringEngine:
    def __init__(self):
        # Weighted Scoring Configuration (as requested)
        self.weights = {
            "resume": 0.30,
            "skill_match": 0.30,
            "communication": 0.20,
            "emotion_confidence": 0.20
        }

    def calculate_final_score(
        self, 
        resume_score: float, 
        skill_score: float, 
        comm_score: float, 
        emotion_score: float
    ) -> Dict[str, Any]:
        """
        Calculate weighted score and provide recommendation.
        """
        total = (
            (resume_score * self.weights["resume"]) + 
            (skill_score * self.weights["skill_match"]) + 
            (comm_score * self.weights["communication"]) + 
            (emotion_score * self.weights["emotion_confidence"])
        )
        total = round(total, 2)

        # Recommendation logic
        recommendation = "Reject"
        if total >= 80:
            recommendation = "Select"
        elif total >= 60:
            recommendation = "Hold"
        
        # Explainable AI (XAI) output
        explanation = {
            "resume_impact": f"Weighted {int(self.weights['resume']*100)}% contributing {round(resume_score * self.weights['resume'], 2)} pts.",
            "skills_impact": f"Weighted {int(self.weights['skill_match']*100)}% contributing {round(skill_score * self.weights['skill_match'], 2)} pts.",
            "comm_impact": f"Communication weighted {int(self.weights['communication']*100)}% contributing {round(comm_score * self.weights['communication'], 2)} pts.",
            "emotion_impact": f"Emotion/Confidence weighted {int(self.weights['emotion_confidence']*100)}% contributing {round(emotion_score * self.weights['emotion_confidence'], 2)} pts.",
        }

        return {
            "total_score": total,
            "recommendation": recommendation,
            "explanation": explanation,
            "breakdown": {
                "resume": resume_score,
                "skills": skill_score,
                "communication": comm_score,
                "emotion": emotion_score
            }
        }

scoring_engine = ScoringEngine()
