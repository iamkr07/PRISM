"""Pydantic schemas for analytics data."""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class Metric(BaseModel):
    """Simple metric with name and value."""
    name: str
    value: int


class SkillMetric(BaseModel):
    """Skill metric."""
    name: str
    value: int


class AnalyticsOverview(BaseModel):
    """Overview analytics."""
    dataset_size: int
    most_common_roles: List[Metric]
    most_common_skills: List[SkillMetric]
    persona_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    market_insights: Optional[Dict[str, Any]] = None


class ComparisonMetrics(BaseModel):
    """Metrics used in comparison."""
    candidate_id: str
    score: float
    persona: Optional[str] = None
    role: Optional[str] = None
    years_of_experience: float
    risk_level: Optional[str] = None
