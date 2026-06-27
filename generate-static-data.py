import sys
import os
import json

# Add backend/api directory to Python path
backend_api_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "api")
sys.path.insert(0, backend_api_dir)

# Create frontend/public/data directory
output_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "frontend", "public", "data"
)
os.makedirs(output_dir, exist_ok=True)

# Load sample data
from services.candidate_service import CandidateService
from services.analytics_service import AnalyticsService
from services.pipeline_service import PipelineService

# Step 1: Get all candidates
print("Generating static data...")
all_metrics = CandidateService.get_all_metrics()

# Take top 50 candidates for the demo
candidates_list = []
for metric in all_metrics:
    profile = CandidateService.get_candidate_profile(metric["candidate_id"])
    if profile:
        candidate_list_item = {
            "candidate_id": metric["candidate_id"],
            "name": metric.get("name", profile["profile"]["anonymized_name"]),
            "headline": profile["profile"]["headline"],
            "location": profile["profile"]["location"],
            "years_of_experience": profile["profile"]["years_of_experience"],
            "current_title": profile["profile"]["current_title"],
            "current_company": profile["profile"]["current_company"],
            "score": metric["score"],
            "persona": metric.get("persona", "Technical Candidate"),
            "role": metric.get("role", "Software Engineer"),
            "recruitability_score": metric.get("recruitability_score", 75),
            "risk_score": metric.get("risk_score", 25),
            "dna_profile": metric.get("dna_profile"),
        }
        candidates_list.append(candidate_list_item)

# Take top 50
candidates_list = candidates_list[:50]
print(f"Using {len(candidates_list)} candidates")

# Step 2: Generate candidate_details.json
candidate_details = {}
for item in candidates_list:
    candidate_id = item["candidate_id"]
    profile = CandidateService.get_candidate_profile(candidate_id)
    metrics = CandidateService.get_candidate_metrics(candidate_id)
    signals = CandidateService.extract_signals(candidate_id)
    risk_factors = CandidateService.extract_risk_factors(metrics)
    strength_factors = CandidateService.extract_strength_factors(profile, metrics)

    # Create decision card
    decision_card = {
        "candidate_id": candidate_id,
        "recommendation": "Shortlist",
        "score": metrics["score"] if metrics else 75,
        "reasoning": CandidateService.get_candidate_reasoning(candidate_id),
        "signals": signals,
        "risk_factors": risk_factors,
        "strength_factors": strength_factors,
    }

    candidate_detail = {
        "profile": profile,
        "metrics": metrics,
        "decision_card": decision_card,
        "score_breakdown": {},
    }
    candidate_details[candidate_id] = candidate_detail

# Step 3: Generate comparison data
comparison_data = {}
for i in range(len(candidates_list)):
    for j in range(i + 1, len(candidates_list)):
        id1 = candidates_list[i]["candidate_id"]
        id2 = candidates_list[j]["candidate_id"]
        m1 = CandidateService.get_candidate_metrics(id1)
        m2 = CandidateService.get_candidate_metrics(id2)

        score1 = m1["score"] if m1 else 70
        score2 = m2["score"] if m2 else 70
        winner = id1 if score1 > score2 else id2
        winner_score = max(score1, score2)
        loser_score = min(score1, score2)

        radar_values_1 = [
            {"axis": "Technical Skills", "value": 85 + (hash(id1) % 15)},
            {"axis": "Leadership", "value": 70 + (hash(id1) % 30)},
            {"axis": "Communication", "value": 75 + (hash(id1) % 25)},
            {"axis": "Experience", "value": 80 + (hash(id1) % 20)},
            {"axis": "Problem Solving", "value": 82 + (hash(id1) % 18)},
        ]
        radar_values_2 = [
            {"axis": "Technical Skills", "value": 85 + (hash(id2) % 15)},
            {"axis": "Leadership", "value": 70 + (hash(id2) % 30)},
            {"axis": "Communication", "value": 75 + (hash(id2) % 25)},
            {"axis": "Experience", "value": 80 + (hash(id2) % 20)},
            {"axis": "Problem Solving", "value": 82 + (hash(id2) % 18)},
        ]

        comparison_result = {
            "candidate_id_1": id1,
            "candidate_id_2": id2,
            "winner": winner,
            "winner_score": winner_score,
            "loser_score": loser_score,
            "radar_values_1": radar_values_1,
            "radar_values_2": radar_values_2,
            "recommendation": f"{candidates_list[i]['name']} is a stronger candidate with {score1} points",
            "comparison_metrics": {
                "score_1": score1,
                "score_2": score2,
                "score_diff": abs(score1 - score2),
                "persona_1": m1.get("persona"),
                "persona_2": m2.get("persona"),
                "role_1": m1.get("role"),
                "role_2": m2.get("role"),
                "recruitability_1": m1.get("recruitability_score"),
                "recruitability_2": m2.get("recruitability_score"),
                "reliability_1": 85,
                "reliability_2": 80,
                "leadership_1": 75,
                "leadership_2": 70,
                "strengths_1": [
                    "Strong technical background",
                    "Excellent problem solving",
                ],
                "strengths_2": [
                    "Great communication",
                    "Leadership experience",
                ],
                "concerns_1": [
                    "Limited experience in specific industry",
                ],
                "concerns_2": [
                    "Needs to develop technical depth",
                ],
            },
        }
        comparison_data[f"{id1}-{id2}"] = comparison_result
        comparison_data[f"{id2}-{id1}"] = comparison_result

# Step 4: Generate analytics.json
analytics_overview = {
    "dataset_size": len(candidates_list),
    "most_common_roles": [
        {"name": "Software Engineer", "value": 25},
        {"name": "Senior Software Engineer", "value": 15},
        {"name": "Data Scientist", "value": 10},
    ],
    "most_common_skills": [
        {"name": "Python", "value": 35},
        {"name": "React", "value": 28},
        {"name": "AWS", "value": 22},
    ],
    "persona_distribution": {
        "Technical Candidate": 30,
        "Leadership Candidate": 15,
        "Business Analyst": 5,
    },
    "risk_distribution": {"Low": 30, "Medium": 15, "High": 5},
    "experience_distribution": {
        "0-2": 5,
        "3-5": 20,
        "6-10": 15,
        "10+": 10,
    },
}

# Step 5: Generate pipeline.json
pipeline_status = {
    "pipeline_status": "Running",
    "total_phases": 4,
    "phases": [
        {
            "phase": "data_ingestion",
            "name": "Data Ingestion",
            "description": "Collecting and validating candidate profiles",
            "status": "completed",
            "artifacts": ["candidates.jsonl"],
        },
        {
            "phase": "feature_extraction",
            "name": "Feature Extraction",
            "description": "Processing and extracting candidate features",
            "status": "completed",
            "artifacts": ["features.parquet"],
        },
        {
            "phase": "model_scoring",
            "name": "Model Scoring",
            "description": "Calculating scores using ML models",
            "status": "running",
            "artifacts": ["scores.parquet"],
        },
        {
            "phase": "analysis_reporting",
            "name": "Analysis & Reporting",
            "description": "Generating insights and reports",
            "status": "pending",
            "artifacts": ["report.pdf"],
        },
    ],
    "overall_progress": "65%",
}

# Step 6: Generate submission.json
submission_ranking = []
for i, item in enumerate(candidates_list):
    submission_ranking.append({
        "rank": i + 1,
        "candidate_id": item["candidate_id"],
        "score": item["score"],
        "reasoning": f"Strong candidate with {item['years_of_experience']} years of experience",
        "recommendation": "Shortlist",
    })

# Step 7: Generate metadata.json
metadata = {
    "version": "1.0.0",
    "generated_at": "2026-06-27T00:00:00Z",
    "candidates_count": len(candidates_list),
    "description": "Static demo dataset for PRISM",
}

# Write JSON files!
with open(os.path.join(output_dir, "candidates.json"), "w") as f:
    json.dump(candidates_list, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'candidates.json')}")

with open(os.path.join(output_dir, "candidate_details.json"), "w") as f:
    json.dump(candidate_details, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'candidate_details.json')}")

with open(os.path.join(output_dir, "comparison.json"), "w") as f:
    json.dump(comparison_data, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'comparison.json')}")

with open(os.path.join(output_dir, "analytics.json"), "w") as f:
    json.dump(analytics_overview, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'analytics.json')}")

with open(os.path.join(output_dir, "pipeline.json"), "w") as f:
    json.dump(pipeline_status, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'pipeline.json')}")

with open(os.path.join(output_dir, "submission.json"), "w") as f:
    json.dump(submission_ranking, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'submission.json')}")

with open(os.path.join(output_dir, "metadata.json"), "w") as f:
    json.dump(metadata, f, indent=2)
print(f"✅ Wrote {os.path.join(output_dir, 'metadata.json')}")

print("\n✅ All static data files generated successfully!")
