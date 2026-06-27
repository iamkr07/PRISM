"""Service for analytics data operations."""
from typing import Dict, Any, List
from collections import Counter
from ..utils import read_json_file, read_jsonl_file


class AnalyticsService:
    """Service for reading analytics data from backend artifacts."""
    
    @staticmethod
    def get_overview() -> Dict[str, Any]:
        """Get analytics overview."""
        try:
            insights = read_json_file('analytics/prism_insights.json')
            return insights
        except FileNotFoundError:
            return {}
    
    @staticmethod
    def get_persona_distribution() -> Dict[str, int]:
        """Get persona distribution from metrics."""
        distribution = Counter()
        try:
            for entry in read_jsonl_file('analytics/candidate_metrics_index.jsonl'):
                persona_data = entry.get('persona')
                if persona_data:
                    # Extract primary_persona if it's a dict
                    if isinstance(persona_data, dict):
                        persona = persona_data.get('primary_persona', 'Unknown')
                    else:
                        persona = persona_data
                    if persona:
                        distribution[persona] += 1
        except FileNotFoundError:
            pass
        return dict(distribution)
    
    @staticmethod
    def get_risk_distribution() -> Dict[str, int]:
        """Get risk distribution from metrics."""
        distribution = Counter()
        try:
            for entry in read_jsonl_file('analytics/candidate_metrics_index.jsonl'):
                risk_score = entry.get('risk_score', 50)
                # Categorize risk based on score
                if risk_score < 25:
                    risk_level = 'Low'
                elif risk_score < 50:
                    risk_level = 'Medium'
                else:
                    risk_level = 'High'
                distribution[risk_level] += 1
        except FileNotFoundError:
            pass
        return dict(distribution)
    
    @staticmethod
    def get_role_distribution() -> Dict[str, int]:
        """Get role distribution from profiles."""
        distribution = Counter()
        try:
            for entry in read_jsonl_file('data/candidates.jsonl'):
                role = entry.get('profile', {}).get('current_title')
                if role:
                    distribution[role] += 1
        except FileNotFoundError:
            pass
        return dict(distribution)
    
    @staticmethod
    def get_skill_distribution() -> Dict[str, int]:
        """Get skill distribution from profiles."""
        distribution = Counter()
        try:
            for entry in read_jsonl_file('data/candidates.jsonl'):
                skills = entry.get('skills', [])
                for skill in skills:
                    distribution[skill] += 1
        except FileNotFoundError:
            pass
        return dict(distribution)
    
    @staticmethod
    def get_dataset_size() -> int:
        """Get total dataset size."""
        try:
            insights = read_json_file('analytics/prism_insights.json')
            return insights.get('dataset_size', 0)
        except FileNotFoundError:
            return 0
