"""Service for submission data operations."""
from typing import List, Dict, Any
from ..utils import read_csv_file


class SubmissionService:
    """Service for submission data."""
    
    @staticmethod
    def get_top_100() -> List[Dict[str, Any]]:
        """Get top 100 candidates from submission."""
        rows = read_csv_file('outputs/submission.csv')
        top_100 = []
        
        for i, row in enumerate(rows[:100]):
            top_100.append({
                'rank': i + 1,
                'candidate_id': row.get('candidate_id'),
                'score': float(row.get('score', 0)),
                'reasoning': row.get('reasoning', ''),
                'recommendation': 'RECOMMEND' if i < 20 else 'SHORTLIST'
            })
        
        return top_100
