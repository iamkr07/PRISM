"""Pydantic schemas for comparison data."""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class RadarValue(BaseModel):
    """Radar chart value."""
    axis: str
    value: float


class ComparisonResult(BaseModel):
    """Comparison result between two candidates."""
    candidate_id_1: str
    candidate_id_2: str
    winner: str
    winner_score: float
    loser_score: float
    radar_values_1: List[RadarValue]
    radar_values_2: List[RadarValue]
    recommendation: str
    comparison_metrics: Dict[str, Any]
