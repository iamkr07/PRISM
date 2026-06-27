"""Service for comparison data operations."""
from typing import Optional, Dict, Any, List
from ..utils import find_jsonl_entry, get_jsonl_entries_batch
from .candidate_service import CandidateService


class ComparisonService:
    """Service for comparing candidates."""
    
    @staticmethod
    def compare_candidates(candidate_id_1: str, candidate_id_2: str) -> Optional[Dict[str, Any]]:
        """Compare two candidates."""
        # Get metrics for both
        metrics_1 = CandidateService.get_candidate_metrics(candidate_id_1)
        metrics_2 = CandidateService.get_candidate_metrics(candidate_id_2)
        
        if not metrics_1 or not metrics_2:
            return None
        
        score_1 = metrics_1.get('score', 0)
        score_2 = metrics_2.get('score', 0)

        analytics_1 = CandidateService.get_candidate_analytics(candidate_id_1) or {}
        analytics_2 = CandidateService.get_candidate_analytics(candidate_id_2) or {}

        dna_1 = analytics_1.get('dna_profile') if isinstance(analytics_1.get('dna_profile'), dict) else {}
        dna_2 = analytics_2.get('dna_profile') if isinstance(analytics_2.get('dna_profile'), dict) else {}

        def extract_score(payload: dict, key: str):
            if isinstance(payload.get(key), dict):
                return payload[key].get('recruitability_score') if key == 'recruitability' else payload[key].get('risk_score')
            return payload.get(key)

        recruitability_1 = extract_score(analytics_1, 'recruitability')
        recruitability_2 = extract_score(analytics_2, 'recruitability')
        reliability_1 = dna_1.get('reliability')
        reliability_2 = dna_2.get('reliability')
        leadership_1 = dna_1.get('leadership')
        leadership_2 = dna_2.get('leadership')

        winner = candidate_id_1 if score_1 >= score_2 else candidate_id_2
        winner_score = max(score_1, score_2)
        loser_score = min(score_1, score_2)

        radar_values_1 = ComparisonService._build_radar_values(analytics_1)
        radar_values_2 = ComparisonService._build_radar_values(analytics_2)

        strengths_1 = CandidateService.extract_strength_factors(
            CandidateService.get_candidate_profile(candidate_id_1),
            metrics_1,
        )
        strengths_2 = CandidateService.extract_strength_factors(
            CandidateService.get_candidate_profile(candidate_id_2),
            metrics_2,
        )

        concerns_1 = CandidateService.extract_risk_factors(metrics_1)
        concerns_2 = CandidateService.extract_risk_factors(metrics_2)

        return {
            'candidate_id_1': candidate_id_1,
            'candidate_id_2': candidate_id_2,
            'winner': winner,
            'winner_score': winner_score,
            'loser_score': loser_score,
            'radar_values_1': radar_values_1,
            'radar_values_2': radar_values_2,
            'recommendation': ComparisonService._get_recommendation(winner_score, loser_score),
            'comparison_metrics': {
                'score_1': score_1,
                'score_2': score_2,
                'score_diff': abs(score_1 - score_2),
                'persona_1': metrics_1.get('persona'),
                'persona_2': metrics_2.get('persona'),
                'role_1': metrics_1.get('role'),
                'role_2': metrics_2.get('role'),
                'recruitability_1': recruitability_1,
                'recruitability_2': recruitability_2,
                'reliability_1': reliability_1,
                'reliability_2': reliability_2,
                'leadership_1': leadership_1,
                'leadership_2': leadership_2,
                'strengths_1': strengths_1,
                'strengths_2': strengths_2,
                'concerns_1': concerns_1,
                'concerns_2': concerns_2,
            }
        }
    
    @staticmethod
    def _build_radar_values(analytics_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build radar chart values from analytics DNA profile."""
        dna_profile = analytics_data.get('dna_profile') if isinstance(analytics_data.get('dna_profile'), dict) else {}
        values = []

        mapping = [
            ('Technical', 'technical_expertise'),
            ('Leadership', 'leadership'),
            ('Growth', 'career_growth'),
            ('Learning Agility', 'learning_agility'),
            ('Demand', 'recruiter_demand'),
            ('Reliability', 'reliability'),
            ('Market Readiness', 'market_readiness'),
        ]

        for label, key in mapping:
            if key in dna_profile and isinstance(dna_profile[key], (int, float)):
                values.append({'axis': label, 'value': dna_profile[key]})

        return values
    
    @staticmethod
    def _get_recommendation(winner_score: float, loser_score: float) -> str:
        """Get recommendation based on scores."""
        diff = winner_score - loser_score
        
        if diff < 1:
            return "Both candidates are equally strong. Consider other factors."
        elif diff < 3:
            return "Slight preference for winner. Close competition."
        elif diff < 5:
            return "Clear preference for winner."
        else:
            return "Strong preference for winner. Significant quality difference."
