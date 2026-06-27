"""Candidate routes."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..services import CandidateService
from ..schemas import CandidateListResponse, CandidateDetailResponse, DecisionCard, CandidateMetrics, CandidateProfile, CareerHistory, Profile

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("", response_model=CandidateListResponse)
async def list_candidates(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    persona: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    sort: Optional[str] = Query("score"),
):
    """
    Get paginated list of candidates.
    
    Parameters:
        - page: Page number (1-indexed)
        - limit: Items per page (max 100)
        - search: Search query (name, company, title)
        - persona: Filter by persona
        - role: Filter by role
        - sort: Sort field (score, rank, name)
    
    Returns paginated candidate list with profile summaries.
    """
    try:
        skip = (page - 1) * limit
        metrics, total = CandidateService.search_candidates(
            search_query=search,
            persona=persona,
            role=role,
            skip=skip,
            limit=limit
        )
        
        # Sort results
        if sort == "rank":
            metrics.sort(key=lambda x: x.get('rank', float('inf')))
        else:  # default to score
            metrics.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        items = []
        for metric in metrics:
            candidate_id = metric.get('candidate_id')
            profile = CandidateService.get_candidate_profile(candidate_id)
            
            # Extract primary persona from persona dict
            persona_data = metric.get('persona')
            if isinstance(persona_data, dict):
                persona = persona_data.get('primary_persona', 'Unknown')
            else:
                persona = persona_data
            
            items.append({
                'candidate_id': candidate_id,
                'name': profile.get('profile', {}).get('anonymized_name', 'Unknown') if profile else 'Unknown',
                'headline': profile.get('profile', {}).get('headline', '') if profile else '',
                'location': profile.get('profile', {}).get('location', '') if profile else '',
                'years_of_experience': profile.get('profile', {}).get('years_of_experience', 0) if profile else 0,
                'current_title': profile.get('profile', {}).get('current_title', '') if profile else '',
                'current_company': profile.get('profile', {}).get('current_company', '') if profile else '',
                'score': metric.get('score', 0),
                'persona': persona,
                'role': metric.get('role'),
                'recruitability_score': metric.get('recruitability_score'),
                'risk_score': metric.get('risk_score'),
                'dna_profile': metric.get('dna_profile'),
            })
        
        has_more = (skip + limit) < total
        
        return CandidateListResponse(
            items=items,
            page=page,
            limit=limit,
            total=total,
            has_more=has_more
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate_detail(candidate_id: str):
    """
    Get detailed candidate information.
    
    Returns:
        - profile: Full candidate profile with history
        - metrics: Score and ranking metrics
        - decision_card: Recommendation and reasoning
        - score_breakdown: Detailed score components
    """
    try:
        # Get data
        profile_data = CandidateService.get_candidate_profile(candidate_id)
        metrics_data = CandidateService.get_candidate_metrics(candidate_id)
        analytics_data = CandidateService.get_candidate_analytics(candidate_id) or {}
        
        if not profile_data or not metrics_data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        # Build profile schema
        profile_obj = profile_data.get('profile', {})
        career_history = [
            CareerHistory(
                company=h.get('company', ''),
                title=h.get('title', ''),
                start_date=h.get('start_date', ''),
                end_date=h.get('end_date'),
                duration_months=h.get('duration_months', 0),
                is_current=h.get('is_current', False),
                industry=h.get('industry', ''),
                company_size=h.get('company_size', ''),
                description=h.get('description', '')
            )
            for h in profile_data.get('career_history', [])
        ]

        recruitability_value = None
        risk_value = None
        if isinstance(analytics_data.get('recruitability'), dict):
            recruitability_value = analytics_data['recruitability'].get('recruitability_score')
        elif isinstance(analytics_data.get('recruitability_score'), (int, float)):
            recruitability_value = analytics_data['recruitability_score']

        if isinstance(analytics_data.get('risk_analysis'), dict):
            risk_value = analytics_data['risk_analysis'].get('risk_score')
        elif isinstance(analytics_data.get('risk_score'), (int, float)):
            risk_value = analytics_data['risk_score']

        profile = CandidateProfile(
            candidate_id=candidate_id,
            profile=Profile(
                anonymized_name=profile_obj.get('anonymized_name', ''),
                headline=profile_obj.get('headline', ''),
                summary=profile_obj.get('summary', ''),
                location=profile_obj.get('location', ''),
                country=profile_obj.get('country', ''),
                years_of_experience=profile_obj.get('years_of_experience', 0),
                current_title=profile_obj.get('current_title', ''),
                current_company=profile_obj.get('current_company', ''),
                current_company_size=profile_obj.get('current_company_size', ''),
                current_industry=profile_obj.get('current_industry', '')
            ),
            career_history=career_history,
            skills=[s['name'] if isinstance(s, dict) else s for s in profile_data.get('skills', [])],
            dna=analytics_data.get('dna_profile') or profile_data.get('dna'),
            recruitability=recruitability_value or profile_data.get('recruitability'),
            risk=risk_value or profile_data.get('risk')
        )
        
        # Build metrics
        reasoning = CandidateService.get_candidate_reasoning(candidate_id)
        metrics = CandidateMetrics(
            candidate_id=candidate_id,
            rank=metrics_data.get('rank'),
            score=metrics_data.get('score', 0),
            reasoning=reasoning,
            persona=metrics_data.get('persona', {}).get('primary_persona', 'Unknown') if isinstance(metrics_data.get('persona'), dict) else metrics_data.get('persona'),
            role=metrics_data.get('role')
        )
        
        # Build decision card
        signals = CandidateService.extract_signals(candidate_id)
        risks = CandidateService.extract_risk_factors(metrics_data)
        strengths = CandidateService.extract_strength_factors(profile_data, metrics_data)
        
        decision_card = DecisionCard(
            candidate_id=candidate_id,
            recommendation=reasoning,
            score=metrics_data.get('score', 0),
            reasoning=reasoning,
            signals=signals,
            risk_factors=risks,
            strength_factors=strengths
        )
        
        # Build score breakdown
        score_breakdown = {
            'overall_score': metrics_data.get('score', 0),
            'rank': metrics_data.get('rank'),
            'role': metrics_data.get('role'),
            'persona': metrics_data.get('persona'),
            'experience_years': profile_obj.get('years_of_experience', 0),
            'recruitability': recruitability_value,
            'risk': risk_value,
            'industry': profile_obj.get('current_industry', ''),
        }
        
        return CandidateDetailResponse(
            profile=profile,
            metrics=metrics,
            decision_card=decision_card,
            score_breakdown=score_breakdown
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
