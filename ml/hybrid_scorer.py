"""
Hybrid Matching Scorer Specification & Algorithm Structure
Phase 1: Architecture Template
"""

class HybridJobMatcher:
    def __init__(self, weights=None):
        # Configurable matching weights (default weights formula)
        self.weights = weights or {
            "semantic": 0.35,
            "skills": 0.30,
            "experience": 0.15,
            "education": 0.10,
            "ats_compatibility": 0.10
        }
        
    def calculate_score(self, semantic_sim: float, skill_sim: float, exp_sim: float, edu_sim: float, ats_sim: float) -> dict:
        """
        Calculates final composite score based on weighted breakdown.
        """
        w = self.weights
        final_score = (
            w["semantic"] * semantic_sim +
            w["skills"] * skill_sim +
            w["experience"] * exp_sim +
            w["education"] * edu_sim +
            w["ats_compatibility"] * ats_sim
        )
        
        return {
            "final_score": round(final_score, 4),
            "breakdown": {
                "semantic_similarity": round(semantic_sim, 4),
                "skill_match": round(skill_sim, 4),
                "experience_match": round(exp_sim, 4),
                "education_match": round(edu_sim, 4),
                "ats_compatibility": round(ats_sim, 4)
            },
            "weights_used": self.weights
        }
