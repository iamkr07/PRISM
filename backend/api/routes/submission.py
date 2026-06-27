"""Submission routes."""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from ..services import SubmissionService

router = APIRouter(prefix="/api/submission", tags=["submission"])


@router.get("/top100", response_model=List[Dict[str, Any]])
async def get_top_100_submission():
    """
    Get top 100 candidates from final submission.
    
    Returns list of top 100 ranked candidates with:
        - rank: Position in ranking
        - candidate_id: Candidate identifier
        - score: Final score
        - reasoning: Why this candidate was ranked here
        - recommendation: Recommendation level (RECOMMEND/SHORTLIST)
    """
    try:
        return SubmissionService.get_top_100()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
