"""Service for pipeline metadata operations."""
import os
from typing import Dict, List, Any, Optional


class PipelineService:
    """Service for pipeline information."""
    
    PHASE_DESCRIPTIONS = {
        "Phase 1": {
            "name": "Data Foundation",
            "description": "Process and validate raw candidate data",
            "artifacts": ["validated_candidates.jsonl", "candidate_schema.json"]
        },
        "Phase 2": {
            "name": "Feature Engineering",
            "description": "Engineer features and metrics for candidates",
            "artifacts": ["phase2_features.jsonl"]
        },
        "Phase 3": {
            "name": "Candidate Intelligence",
            "description": "Generate candidate intelligence profiles",
            "artifacts": ["phase3_intelligence.jsonl"]
        },
        "Phase 4": {
            "name": "Smart Ranking",
            "description": "Calculate and rank candidates",
            "artifacts": ["phase4_ranked_candidates.jsonl"]
        },
        "Phase 5": {
            "name": "Explainability",
            "description": "Generate reasoning and explanations",
            "artifacts": ["phase5_explanations.jsonl"]
        },
        "Phase 6": {
            "name": "Validation & Submission",
            "description": "Validate and prepare final submission",
            "artifacts": ["submission.csv", "submission_metadata.yaml"]
        },
        "Phase 7": {
            "name": "Intelligence & Analytics",
            "description": "Generate analytics and insights",
            "artifacts": ["candidate_analytics_profiles.jsonl", "candidate_metrics_index.jsonl", "prism_insights.json"]
        }
    }
    
    @staticmethod
    def get_pipeline_status() -> Dict[str, Any]:
        """Get pipeline status and phases using files present in backend/outputs."""
        phases: List[Dict[str, Any]] = []

        # Determine outputs directory relative to this file
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        outputs_dir = os.path.join(base_dir, 'outputs')

        total_phases = len(PipelineService.PHASE_DESCRIPTIONS)
        completed_count = 0

        for phase_id, phase_info in PipelineService.PHASE_DESCRIPTIONS.items():
            artifacts = phase_info.get('artifacts', [])
            artifact_paths = []
            for artifact in artifacts:
                artifact_paths.append(PipelineService.find_artifact_path(outputs_dir, artifact))

            # Check artifacts existence
            exists_flags = [p is not None for p in artifact_paths]

            if artifacts and all(exists_flags):
                status = 'completed'
                completed_count += 1
            elif artifacts and any(exists_flags):
                status = 'running'
            else:
                    status = 'pending'

            phases.append({
                'phase': phase_id,
                'name': phase_info.get('name'),
                'description': phase_info.get('description'),
                'status': status,
                'artifacts': artifacts,
            })

        overall_progress = f"{round((completed_count / total_phases) * 100)}%"
        if completed_count == total_phases:
            pipeline_status = 'completed'
        elif completed_count == 0:
            pipeline_status = 'pending'
        else:
            pipeline_status = 'running'

        return {
            'pipeline_status': pipeline_status,
            'total_phases': total_phases,
            'phases': phases,
            'overall_progress': overall_progress,
        }

    @staticmethod
    def find_artifact_path(base_outputs_dir: str, filename: str) -> Optional[str]:
        search_dirs = [
            base_outputs_dir,
            os.path.join(os.path.dirname(base_outputs_dir), 'analytics'),
            os.path.join(os.path.dirname(base_outputs_dir), 'data'),
            os.path.join(os.path.dirname(base_outputs_dir), 'config'),
        ]

        for search_dir in search_dirs:
            candidate = os.path.join(search_dir, filename)
            if os.path.exists(candidate):
                return candidate
        return None
