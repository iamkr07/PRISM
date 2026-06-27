"""Service for candidate data operations."""
from typing import List, Dict, Any, Optional, Tuple
from ..utils import (
    read_jsonl_file,
    find_jsonl_entry,
    get_jsonl_entries_batch,
    read_csv_file
)


class CandidateService:
    """Service for reading candidate data from backend artifacts."""
    
    @staticmethod
    def get_candidate_profile(candidate_id: str) -> Optional[Dict[str, Any]]:
        """Get full candidate profile."""
        profile = find_jsonl_entry('data/candidates.jsonl', candidate_id)
        return profile
    
    @staticmethod
    def get_candidate_metrics(candidate_id: str) -> Optional[Dict[str, Any]]:
        """Get candidate metrics from analytics."""
        metrics = find_jsonl_entry('analytics/candidate_metrics_index.jsonl', candidate_id)
        return metrics
    
    @staticmethod
    def get_candidate_analytics(candidate_id: str) -> Optional[Dict[str, Any]]:
        """Get candidate analytics profile."""
        analytics = find_jsonl_entry('analytics/candidate_analytics_profiles.jsonl', candidate_id)
        return analytics
    
    @staticmethod
    def get_all_metrics() -> List[Dict[str, Any]]:
        """Get all candidate metrics. Used for listing and pagination."""
        metrics = []
        try:
            for entry in read_jsonl_file('analytics/candidate_metrics_index.jsonl'):
                metrics.append(entry)
        except FileNotFoundError:
            pass
        return metrics
    
    @staticmethod
    def get_submission_top100() -> List[Dict[str, str]]:
        """Get top 100 candidates from submission.csv."""
        rows = read_csv_file('outputs/submission.csv')
        return rows[:100]
    
    @staticmethod
    def get_candidate_reasoning(candidate_id: str) -> str:
        """Get reasoning for a candidate from submission.csv."""
        try:
            rows = read_csv_file('outputs/submission.csv')
            for row in rows:
                if row.get('candidate_id') == candidate_id:
                    return row.get('reasoning', '')
        except FileNotFoundError:
            pass
        return ''
    
    @staticmethod
    def search_candidates(
        search_query: Optional[str] = None,
        persona: Optional[str] = None,
        role: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Search and filter candidates."""
        all_metrics = CandidateService.get_all_metrics()
        
        # Filter
        filtered = all_metrics
        
        if search_query:
            search_lower = search_query.lower()
            filtered = [
                m for m in filtered 
                if search_lower in str(m.get('name', '')).lower() or
                   search_lower in str(m.get('current_company', '')).lower() or
                   search_lower in str(m.get('current_title', '')).lower()
            ]
        
        if persona:
            filtered = [m for m in filtered if m.get('persona') == persona]
        
        if role:
            filtered = [m for m in filtered if m.get('role') == role]
        
        total = len(filtered)
        
        # Paginate
        paginated = filtered[skip:skip + limit]
        
        return paginated, total
    
    @staticmethod
    def get_comparison_data(candidate_id: str) -> Optional[Dict[str, Any]]:
        """Get candidate comparison data."""
        data = find_jsonl_entry('backend/analytics/candidate_comparison_samples.jsonl', candidate_id)
        return data
    
    @staticmethod
    def extract_signals(candidate_id: str) -> List[str]:
        """Extract signals from candidate profile."""
        profile = CandidateService.get_candidate_profile(candidate_id)
        signals = []
        
        if profile:
            # Extract from career history
            if profile.get('career_history'):
                has_promotions = any(
                    h.get('is_current') == False 
                    for h in profile['career_history']
                )
                if has_promotions:
                    signals.append("Career progression visible")
            
            # Check skills
            if profile.get('skills'):
                skill_names = []
                for skill in profile['skills'][:3]:
                    if isinstance(skill, dict):
                        skill_names.append(skill.get('name', ''))
                    else:
                        skill_names.append(skill)
                if skill_names:
                    signals.append(f"Skills: {', '.join(skill_names)}")
            
            # Check location
            if profile.get('profile', {}).get('location'):
                signals.append(f"Based in {profile['profile']['location']}")
        
        return signals
    
    @staticmethod
    def extract_risk_factors(metrics: Optional[Dict[str, Any]]) -> List[str]:
        """Extract risk factors from metrics."""
        risks = []
        
        if metrics:
            if metrics.get('risk_level') == 'high':
                risks.append("High risk profile")
            elif metrics.get('risk_level') == 'medium':
                risks.append("Medium risk profile")
        
        return risks
    
    @staticmethod
    def extract_strength_factors(profile: Optional[Dict[str, Any]], metrics: Optional[Dict[str, Any]]) -> List[str]:
        """Extract strength factors."""
        strengths = []
        
        if profile:
            years = profile.get('profile', {}).get('years_of_experience', 0)
            if years > 5:
                strengths.append(f"Strong {years}+ years of experience")
            
            if profile.get('profile', {}).get('current_company_size') == '10001+':
                strengths.append("Currently at large company")
        
        if metrics:
            score = metrics.get('score', 0)
            if score > 85:
                strengths.append(f"High quality score ({score:.1f})")
        
        return strengths
