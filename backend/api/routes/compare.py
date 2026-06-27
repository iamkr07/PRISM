"""Comparison routes."""
from fastapi import APIRouter, HTTPException, Query
from ..services import ComparisonService
from ..schemas import ComparisonResult, RadarValue

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("", response_model=ComparisonResult)
async def compare_candidates(
    id1: str = Query(..., description="First candidate ID"),
    id2: str = Query(..., description="Second candidate ID"),
):
    """
    Compare two candidates.
    
    Parameters:
        - id1: First candidate ID
        - id2: Second candidate ID
    
    Returns:
        - winner: ID of better candidate
        - winner_score: Score of winner
        - loser_score: Score of loser
        - radar_values_1/2: Multi-dimensional metrics for radar chart
        - recommendation: Recommendation text
        - comparison_metrics: Detailed comparison data
    """
    try:
        if id1 == id2:
            raise HTTPException(status_code=400, detail="Cannot compare candidate with itself")
        
        result = ComparisonService.compare_candidates(id1, id2)
        
        if not result:
            raise HTTPException(status_code=404, detail="One or both candidates not found")
        
        # Convert to schema
        radar_1 = [RadarValue(axis=v['axis'], value=v['value']) for v in result['radar_values_1']]
        radar_2 = [RadarValue(axis=v['axis'], value=v['value']) for v in result['radar_values_2']]
        
        return ComparisonResult(
            candidate_id_1=result['candidate_id_1'],
            candidate_id_2=result['candidate_id_2'],
            winner=result['winner'],
            winner_score=result['winner_score'],
            loser_score=result['loser_score'],
            radar_values_1=radar_1,
            radar_values_2=radar_2,
            recommendation=result['recommendation'],
            comparison_metrics=result['comparison_metrics']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
