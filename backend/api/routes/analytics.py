"""Analytics routes."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def get_analytics_overview() -> Dict[str, Any]:
    """
    Get analytics overview with KPIs, distributions, and insights.
    
    Returns:
        - dataset_size: Total number of candidates
        - most_common_roles: Top roles in dataset
        - most_common_skills: Top skills in dataset
        - persona_distribution: Distribution of personas
        - risk_distribution: Distribution of risk levels
        - market_insights: Market insights and trends
    """
    try:
        overview = AnalyticsService.get_overview()
        persona_dist = AnalyticsService.get_persona_distribution()
        risk_dist = AnalyticsService.get_risk_distribution()

        return {
            **overview,
            'persona_distribution': persona_dist,
            'risk_distribution': risk_dist,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
