"""Pydantic schemas for candidate data."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CareerHistory(BaseModel):
    """Career history entry."""
    company: str
    title: str
    start_date: str
    end_date: Optional[str]
    duration_months: float
    is_current: bool
    industry: str
    company_size: str
    description: str


class Profile(BaseModel):
    """Candidate profile."""
    anonymized_name: str
    headline: str
    summary: str
    location: str
    country: str
    years_of_experience: float
    current_title: str
    current_company: str
    current_company_size: str
    current_industry: str


class CandidateProfile(BaseModel):
    """Full candidate profile."""
    candidate_id: str
    profile: Profile
    career_history: List[CareerHistory]
    skills: Optional[List[str]] = None
    dna: Optional[Dict[str, Any]] = None
    recruitability: Optional[float] = None
    risk: Optional[float] = None


class CandidateMetrics(BaseModel):
    """Candidate metrics."""
    candidate_id: str
    rank: Optional[int] = None
    score: float
    reasoning: str
    persona: Optional[str] = None
    role: Optional[str] = None


class CandidateListItem(BaseModel):
    """Candidate in list."""
    candidate_id: str
    name: str
    headline: str
    location: str
    years_of_experience: float
    current_title: str
    current_company: str
    score: float
    persona: Optional[str] = None
    role: Optional[str] = None
    recruitability_score: Optional[float] = None
    risk_score: Optional[float] = None
    dna_profile: Optional[Dict[str, Any]] = None


class CandidateListResponse(BaseModel):
    """Paginated candidate list response."""
    items: List[CandidateListItem]
    page: int
    limit: int
    total: int
    has_more: bool


class DecisionCard(BaseModel):
    """Decision card for a candidate."""
    candidate_id: str
    recommendation: str
    score: float
    reasoning: str
    signals: List[str]
    risk_factors: List[str]
    strength_factors: List[str]


class CandidateDetailResponse(BaseModel):
    """Detailed candidate response."""
    profile: CandidateProfile
    metrics: CandidateMetrics
    decision_card: DecisionCard
    score_breakdown: Dict[str, Any]
