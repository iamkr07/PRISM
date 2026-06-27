#!/usr/bin/env python3
"""Generate static frontend data matching the exact expected types."""
import json
import os
import random
from typing import List, Dict, Any, Optional
from pathlib import Path


def load_sample_candidates() -> List[Dict[str, Any]]:
    """Load sample candidates from sample_candidates.json."""
    sample_path = Path("backend/data/sample_candidates.json")
    if sample_path.exists():
        with open(sample_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def generate_analytics_overview(candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate analytics overview matching the AnalyticsOverview type."""
    total = len(candidates)
    roles = ["Software Engineer", "Product Manager", "Data Scientist", "Designer", "Marketing"]
    skills = ["Python", "React", "SQL", "Machine Learning", "Leadership"]
    personas = ["Technical Leader", "Product Visionary", "Creative Thinker", "Data Analyst", "Marketing Guru"]
    risk_levels = ["low", "medium", "high"]
    
    # Count distributions
    role_counts = {role: random.randint(5, 15) for role in roles}
    skill_counts = {skill: random.randint(8, 20) for skill in skills}
    persona_counts = {persona: random.randint(6, 12) for persona in personas}
    risk_counts = {level: random.randint(5, 25) for level in risk_levels}
    
    most_common_roles = [{"name": role, "value": count} for role, count in role_counts.items()]
    most_common_skills = [{"name": skill, "value": count} for skill, count in skill_counts.items()]
    
    top_candidate_ids = [f"CAND_{str(i).zfill(7)}" for i in range(1, 11)]
    
    return {
        "dataset_size": total,
        "most_common_roles": most_common_roles,
        "most_common_skills": most_common_skills,
        "persona_distribution": persona_counts,
        "risk_distribution": risk_counts,
        "average_experience_years": 6.5,
        "median_experience_years": 5.8,
        "top_ranked_candidates": top_candidate_ids,
    }


def generate_candidate_list_response(
    candidates: List[Dict[str, Any]],
    page: int = 1,
    limit: int = 20
) -> Dict[str, Any]:
    """Generate CandidateListResponse exactly matching the type."""
    items = []
    persona_options = ["Technical Leader", "Product Visionary", "Creative Thinker", "Data Analyst", "Marketing Guru"]
    role_options = ["Software Engineer", "Product Manager", "Data Scientist", "Designer", "Marketing"]
    
    for i, candidate in enumerate(candidates):
        profile = candidate.get("profile", {})
        items.append({
            "candidate_id": candidate.get("candidate_id"),
            "name": profile.get("anonymized_name", "Unknown"),
            "headline": profile.get("headline", ""),
            "location": profile.get("location", ""),
            "years_of_experience": profile.get("years_of_experience", 0),
            "current_title": profile.get("current_title", ""),
            "current_company": profile.get("current_company", ""),
            "score": round(random.uniform(60, 95), 1),
            "persona": random.choice(persona_options),
            "role": random.choice(role_options),
            "recruitability_score": round(random.uniform(70, 98), 1),
            "risk_score": round(random.uniform(10, 35), 1),
            "dna_profile": {
                "engineering": random.randint(70, 95),
                "leadership": random.randint(65, 92),
                "communication": random.randint(60, 90),
                "product_sense": random.randint(55, 88),
                "growth_potential": random.randint(75, 98),
            },
        })
    
    # Sort by score descending
    items.sort(key=lambda x: x["score"], reverse=True)
    
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    has_more = end < total
    
    return {
        "items": items[start:end],
        "page": page,
        "limit": limit,
        "total": total,
        "has_more": has_more,
    }


def generate_candidate_detail_response(
    candidate: Dict[str, Any],
    rank: int,
    score: float
) -> Dict[str, Any]:
    """Generate CandidateDetailResponse exactly matching type."""
    cid = candidate.get("candidate_id")
    profile = candidate.get("profile", {})
    career_history = candidate.get("career_history", [])
    skills = candidate.get("skills", [])
    
    # Process skills
    processed_skills = []
    for skill in skills:
        if isinstance(skill, dict):
            processed_skills.append(skill.get("name", ""))
        else:
            processed_skills.append(str(skill))
    
    decision_reasoning = (
        f"Strong {profile.get('current_title')} with {profile.get('years_of_experience')} years of experience. "
        f"Excellent track record at {profile.get('current_company')}. Shows strong leadership potential."
    )
    
    signals = ["Career progression visible", f"Skills: {', '.join(processed_skills[:3])}", f"Based in {profile.get('location')}"]
    risk_factors = ["Remote work fit"] if random.random() > 0.5 else []
    strength_factors = [
        f"Strong {profile.get('years_of_experience')}+ years experience",
        "Currently at large company" if profile.get("current_company_size") == "10001+" else "",
        f"High quality score ({score:.1f})"
    ]
    strength_factors = [s for s in strength_factors if s]
    
    dna_values = [
        {"name": "Technical Depth", "value": random.randint(75, 95)},
        {"name": "Leadership", "value": random.randint(70, 92)},
        {"name": "Communication", "value": random.randint(65, 90)},
        {"name": "Product Sense", "value": random.randint(60, 88)},
        {"name": "Growth Potential", "value": random.randint(78, 98)},
    ]
    
    return {
        "profile": {
            "candidate_id": cid,
            "profile": profile,
            "career_history": career_history,
            "skills": processed_skills,
            "dna": {v["name"]: v["value"] for v in dna_values},
            "recruitability": round(random.uniform(75, 98), 1),
            "risk": round(random.uniform(15, 35), 1),
        },
        "metrics": {
            "candidate_id": cid,
            "rank": rank,
            "score": score,
            "reasoning": decision_reasoning,
            "persona": random.choice(["Technical Leader", "Product Visionary", "Creative Thinker", "Data Analyst"]),
            "role": random.choice(["Software Engineer", "Product Manager", "Data Scientist", "Designer"]),
        },
        "decision_card": {
            "candidate_id": cid,
            "recommendation": "Proceed to interview",
            "score": score,
            "reasoning": decision_reasoning,
            "signals": signals,
            "risk_factors": risk_factors,
            "strength_factors": strength_factors,
        },
        "score_breakdown": {
            "technical_skills": 85,
            "experience": 88,
            "cultural_fit": 79,
            "leadership": 82,
            "growth_potential": 90,
        },
    }


def generate_comparison_result(
    c1: Dict[str, Any],
    c2: Dict[str, Any],
    score1: float,
    score2: float,
    rank1: int,
    rank2: int
) -> Dict[str, Any]:
    """Generate ComparisonResult exactly matching type."""
    winner = c1["candidate_id"] if score1 > score2 else c2["candidate_id"]
    winner_score = score1 if score1 > score2 else score2
    loser_score = score2 if score1 > score2 else score1
    
    radar_values_1 = [
        {"axis": "Technical", "value": random.randint(75, 95)},
        {"axis": "Leadership", "value": random.randint(70, 92)},
        {"axis": "Communication", "value": random.randint(65, 90)},
        {"axis": "Product", "value": random.randint(60, 88)},
        {"axis": "Growth", "value": random.randint(78, 98)},
    ]
    radar_values_2 = [
        {"axis": "Technical", "value": random.randint(72, 93)},
        {"axis": "Leadership", "value": random.randint(68, 90)},
        {"axis": "Communication", "value": random.randint(62, 88)},
        {"axis": "Product", "value": random.randint(58, 86)},
        {"axis": "Growth", "value": random.randint(75, 96)},
    ]
    
    return {
        "candidate_id_1": c1["candidate_id"],
        "candidate_id_2": c2["candidate_id"],
        "winner": winner,
        "winner_score": winner_score,
        "loser_score": loser_score,
        "radar_values_1": radar_values_1,
        "radar_values_2": radar_values_2,
        "recommendation": (
            f"Both candidates are strong. {c1['profile']['anonymized_name']} has better technical skills, "
            f"while {c2['profile']['anonymized_name']} has more leadership experience. Recommend interviewing both."
        ),
        "comparison_metrics": {
            "score_1": score1,
            "score_2": score2,
            "score_diff": round(abs(score1 - score2), 1),
            "persona_1": "Technical Leader",
            "persona_2": "Product Visionary",
            "role_1": "Software Engineer",
            "role_2": "Product Manager",
            "recruitability_1": round(random.uniform(75, 98), 1),
            "recruitability_2": round(random.uniform(72, 95), 1),
            "reliability_1": 92,
            "reliability_2": 88,
            "leadership_1": 85,
            "leadership_2": 91,
            "strengths_1": ["Strong technical background", "Fast learner"],
            "strengths_2": ["Excellent communication", "Proven leadership"],
            "concerns_1": ["Less experience managing teams"],
            "concerns_2": ["Needs more technical depth"],
        },
    }


def generate_pipeline_status() -> Dict[str, Any]:
    """Generate PipelineStatus exactly matching type."""
    phases = [
        {
            "phase": "1",
            "name": "Data Foundation",
            "description": "Data ingestion and validation",
            "status": "completed",
            "artifacts": ["validated_candidates.jsonl", "data_schema.json"],
        },
        {
            "phase": "2",
            "name": "Feature Engineering",
            "description": "Extract candidate features",
            "status": "completed",
            "artifacts": ["phase2_features.jsonl"],
        },
        {
            "phase": "3",
            "name": "Candidate Intelligence",
            "description": "Compute candidate intelligence scores",
            "status": "completed",
            "artifacts": ["phase3_intelligence.jsonl"],
        },
        {
            "phase": "4",
            "name": "Smart Ranking",
            "description": "Rank candidates using AI",
            "status": "completed",
            "artifacts": ["phase4_ranked_candidates.jsonl"],
        },
        {
            "phase": "5",
            "name": "Explainability",
            "description": "Generate decision reasoning",
            "status": "running",
            "artifacts": ["phase5_explanations.jsonl"],
        },
        {
            "phase": "6",
            "name": "Validation & Submission",
            "description": "Validate and prepare final submission",
            "status": "pending",
            "artifacts": ["submission.csv"],
        },
        {
            "phase": "7",
            "name": "Intelligence Analytics",
            "description": "Generate analytics dashboards",
            "status": "pending",
            "artifacts": ["candidate_metrics_index.jsonl", "candidate_analytics_profiles.jsonl"],
        },
    ]
    
    return {
        "pipeline_status": "Running",
        "total_phases": len(phases),
        "phases": phases,
        "overall_progress": "68%",
    }


def generate_submission_ranking(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate SubmissionRankingItem list."""
    items = []
    for i, candidate in enumerate(candidates):
        score = round(random.uniform(75, 98), 1)
        items.append({
            "rank": i + 1,
            "candidate_id": candidate.get("candidate_id"),
            "score": score,
            "reasoning": f"Strong candidate with {candidate.get('profile', {}).get('years_of_experience')} years of experience.",
            "recommendation": "High priority interview",
        })
    return sorted(items, key=lambda x: x["rank"])


def main():
    """Generate all static frontend data files."""
    # Create frontend public/data directory
    data_dir = Path("frontend/public/data")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Load data
    candidates = load_sample_candidates()
    
    # Generate all data
    print("Generating analytics...")
    analytics = generate_analytics_overview(candidates)
    with open(data_dir / "analytics.json", "w", encoding="utf-8") as f:
        json.dump(analytics, f, indent=2, ensure_ascii=False)
    
    print("Generating candidate list...")
    candidate_list_response = generate_candidate_list_response(candidates, limit=50)
    all_candidate_items = candidate_list_response["items"]
    
    # Save candidates as list (for demoApi to fetch all)
    with open(data_dir / "candidates.json", "w", encoding="utf-8") as f:
        json.dump(all_candidate_items, f, indent=2, ensure_ascii=False)
    
    print("Generating candidate details...")
    candidate_details = {}
    for i, candidate in enumerate(candidates):
        cid = candidate.get("candidate_id")
        score = next(
            (item["score"] for item in all_candidate_items if item["candidate_id"] == cid),
            80.0
        )
        rank = next(
            (idx + 1 for idx, item in enumerate(all_candidate_items) if item["candidate_id"] == cid),
            i + 1
        )
        candidate_details[cid] = generate_candidate_detail_response(candidate, rank, score)
    
    with open(data_dir / "candidate_details.json", "w", encoding="utf-8") as f:
        json.dump(candidate_details, f, indent=2, ensure_ascii=False)
    
    print("Generating comparison data...")
    comparison = {}
    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            c1 = candidates[i]
            c2 = candidates[j]
            score1 = next((item["score"] for item in all_candidate_items if item["candidate_id"] == c1["candidate_id"]), 80)
            score2 = next((item["score"] for item in all_candidate_items if item["candidate_id"] == c2["candidate_id"]), 80)
            rank1 = next((idx + 1 for idx, item in enumerate(all_candidate_items) if item["candidate_id"] == c1["candidate_id"]), i+1)
            rank2 = next((idx + 1 for idx, item in enumerate(all_candidate_items) if item["candidate_id"] == c2["candidate_id"]), j+1)
            comp = generate_comparison_result(c1, c2, score1, score2, rank1, rank2)
            key1 = f"{c1['candidate_id']}-{c2['candidate_id']}"
            key2 = f"{c2['candidate_id']}-{c1['candidate_id']}"
            comparison[key1] = comp
            comparison[key2] = comp  # for reverse lookup
    with open(data_dir / "comparison.json", "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=2, ensure_ascii=False)
    
    print("Generating pipeline status...")
    pipeline = generate_pipeline_status()
    with open(data_dir / "pipeline.json", "w", encoding="utf-8") as f:
        json.dump(pipeline, f, indent=2, ensure_ascii=False)
    
    print("Generating submission ranking...")
    submission = generate_submission_ranking(candidates)
    with open(data_dir / "submission.json", "w", encoding="utf-8") as f:
        json.dump(submission, f, indent=2, ensure_ascii=False)
    
    print("Generating metadata...")
    metadata = {
        "source": "backend/data/sample_candidates.json",
        "total_exported": len(candidates),
        "generated_at": "2026-06-27",
        "top_candidate_ids": [item["candidate_id"] for item in all_candidate_items[:10]],
    }
    with open(data_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print("Static frontend data generated successfully!")
    print(f"   Exported candidates: {len(candidates)}")
    print(f"   Files created in: {data_dir}")


if __name__ == "__main__":
    main()
