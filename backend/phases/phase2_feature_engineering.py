from __future__ import annotations

import argparse
import json
import logging
import math
import re
import sys
import time
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from phases.phase1_data_foundation import Phase1DataFoundation, Candidate, load_jsonl, normalize_string

LOGGER_NAME = "prism.phase2"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DEFAULT_INPUT_PATH = OUTPUTS_DIR / "validated_candidates.jsonl"
DEFAULT_OUTPUT_PATH = OUTPUTS_DIR / "phase2_features.jsonl"
DEFAULT_SCHEMA_PATH = DATA_DIR / "candidate_schema.json"


class Phase2FeatureEngineering:
    def __init__(self, schema_path: Path, logger: logging.Logger | None = None) -> None:
        self.logger = logger or self._get_logger()
        self.foundation = Phase1DataFoundation(schema_path=schema_path, logger=self.logger)

    def _get_logger(self) -> logging.Logger:
        logger = logging.getLogger(LOGGER_NAME)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(DEFAULT_LOG_FORMAT)
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        return logger

    def run(self, input_path: Path, output_path: Path) -> tuple[int, int, int, int]:
        self.logger.info("Starting Phase 2 feature engineering")
        start_ts = time.monotonic()

        processed = 0
        skipped = 0
        max_feature_count = 0

        with input_path.open("r", encoding="utf-8") as stream, output_path.open("w", encoding="utf-8", newline="") as out_stream:
            for line_number, record, raw_line in load_jsonl(input_path, self.logger):
                try:
                    candidate = self.foundation.build_candidate(self.foundation.normalize_record(record))
                    features = self.extract_candidate_features(candidate)
                    output = {"candidate_id": candidate.candidate_id, "features": features}
                    out_stream.write(json.dumps(output, ensure_ascii=False) + "\n")
                    processed += 1
                    max_feature_count = max(max_feature_count, len(features))
                except Exception as exc:
                    skipped += 1
                    self.logger.warning("Line %s: skipping candidate due to extraction error: %s", line_number, exc)
                    self.logger.debug("Raw line: %s", raw_line)

        elapsed = time.monotonic() - start_ts
        self.logger.info("Phase 2 complete")
        self.logger.info("Candidates processed: %d", processed)
        self.logger.info("Candidates skipped: %d", skipped)
        self.logger.info("Max feature fields extracted: %d", max_feature_count)
        self.logger.info("Processing time: %.2f seconds", elapsed)
        self.logger.info("Output file: %s", output_path)

        return processed, skipped, max_feature_count, int(elapsed)

    def extract_candidate_features(self, candidate: Candidate) -> dict[str, Any]:
        features: dict[str, Any] = {}
        features.update(self._extract_work_experience(candidate))
        features.update(self._extract_skills(candidate))
        features.update(self._extract_education(candidate))
        features.update(self._extract_certifications(candidate))
        features.update(self._extract_career_history(candidate))
        features.update(self._extract_redrob_signals(candidate))
        features.update(self._extract_skill_depth(candidate))
        features.update(self._extract_skill_diversity(candidate))
        features.update(self._extract_career_progression(candidate))
        return features

    def _parse_date(self, value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            try:
                return datetime.strptime(value, "%Y-%m-%d")
            except ValueError:
                return None

    def _safe_int(self, value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _extract_work_experience(self, candidate: Candidate) -> dict[str, Any]:
        career_history = candidate.career_history
        num_roles = len(career_history)
        total_duration_months = sum(self._safe_int(entry.duration_months) for entry in career_history)
        current_role_duration_months = 0
        first_start_date = None
        for entry in career_history:
            if entry.is_current:
                current_role_duration_months = self._safe_int(entry.duration_months)
            entry_date = self._parse_date(entry.start_date)
            if entry_date and (first_start_date is None or entry_date < first_start_date):
                first_start_date = entry_date

        years_since_first_role = None
        if first_start_date:
            years_since_first_role = round((datetime.utcnow() - first_start_date).days / 365.25, 2)

        unique_companies = len({entry.company.strip().lower() for entry in career_history if entry.company})
        industry_count = len({entry.industry.strip().lower() for entry in career_history if entry.industry})

        return {
            "profile_years_of_experience": round(candidate.profile.years_of_experience, 2),
            "career_num_roles": num_roles,
            "career_total_duration_months": total_duration_months,
            "career_average_duration_months": round(total_duration_months / num_roles, 2) if num_roles else 0,
            "current_role_duration_months": current_role_duration_months,
            "career_years_since_first_role": round(years_since_first_role, 2) if years_since_first_role is not None else None,
            "career_unique_companies": unique_companies,
            "career_unique_industries": industry_count,
        }

    def _extract_skills(self, candidate: Candidate) -> dict[str, Any]:
        skill_counts = Counter(entry.proficiency.lower() for entry in candidate.skills if entry.proficiency)
        total_skills = len(candidate.skills)
        total_endorsements = sum(self._safe_int(entry.endorsements) for entry in candidate.skills)
        total_duration_months = sum(self._safe_int(entry.duration_months) for entry in candidate.skills if entry.duration_months is not None)
        total_nonzero = total_skills or 1

        return {
            "skill_total_count": total_skills,
            "skill_expert_count": skill_counts.get("expert", 0),
            "skill_advanced_count": skill_counts.get("advanced", 0),
            "skill_intermediate_count": skill_counts.get("intermediate", 0),
            "skill_beginner_count": skill_counts.get("beginner", 0),
            "skill_total_endorsements": total_endorsements,
            "skill_avg_endorsements": round(total_endorsements / total_nonzero, 2),
            "skill_total_duration_months": total_duration_months,
            "skill_average_duration_months": round(total_duration_months / total_nonzero, 2),
        }

    def _extract_education(self, candidate: Candidate) -> dict[str, Any]:
        education = candidate.education
        degree_hierarchy = {
            "phd": 6,
            "doctor": 6,
            "master": 5,
            "m\.sc": 5,
            "m\.tech": 5,
            "mba": 5,
            "bachelor": 4,
            "b\.sc": 4,
            "b\.tech": 4,
            "graduat": 4,
            "diploma": 3,
            "high school": 2,
            "secondary": 2,
        }

        highest_degree_value = 0
        highest_degree_label = None
        institution_tiers = {entry.tier for entry in education if entry.tier}
        for entry in education:
            degree = entry.degree.lower() if entry.degree else ""
            for pattern, value in degree_hierarchy.items():
                if re.search(pattern, degree):
                    if value > highest_degree_value:
                        highest_degree_value = value
                        highest_degree_label = entry.degree
                        break

        num_education = len(education)
        top_tier_levels = {tier for tier in institution_tiers if tier in {"tier_1", "tier_2"}}
        has_top_tier = bool(top_tier_levels)

        return {
            "education_count": num_education,
            "education_has_top_tier": has_top_tier,
            "education_highest_degree": highest_degree_label,
            "education_highest_degree_value": highest_degree_value,
            "education_has_grade": any(entry.grade is not None and str(entry.grade).strip() for entry in education),
        }

    def _extract_certifications(self, candidate: Candidate) -> dict[str, Any]:
        certification_count = len(candidate.certifications)
        return {
            "certification_count": certification_count,
            "has_certifications": certification_count > 0,
        }

    def _extract_career_history(self, candidate: Candidate) -> dict[str, Any]:
        career_history = candidate.career_history
        num_history = len(career_history)
        unique_titles = len({entry.title.strip().lower() for entry in career_history if entry.title})
        unique_industries = len({entry.industry.strip().lower() for entry in career_history if entry.industry})
        unique_company_sizes = len({entry.company_size.strip().lower() for entry in career_history if entry.company_size})
        unique_companies = len({entry.company.strip().lower() for entry in career_history if entry.company})

        return {
            "career_history_count": num_history,
            "career_history_unique_titles": unique_titles,
            "career_history_unique_industries": unique_industries,
            "career_history_unique_company_sizes": unique_company_sizes,
            "career_history_unique_companies": unique_companies,
        }

    def _extract_redrob_signals(self, candidate: Candidate) -> dict[str, Any]:
        signals = candidate.redrob_signals
        signup_date = self._parse_date(signals.signup_date)
        last_active_date = self._parse_date(signals.last_active_date)
        days_active = None
        if signup_date and last_active_date:
            days_active = (last_active_date - signup_date).days

        high_engagement = None
        if signals.profile_views_received_30d or signals.search_appearance_30d:
            high_engagement = round(
                (signals.profile_views_received_30d + signals.search_appearance_30d) / max(1, signals.applications_submitted_30d),
                2,
            )

        return {
            "redrob_profile_completeness_score": signals.profile_completeness_score,
            "redrob_open_to_work": signals.open_to_work_flag,
            "redrob_recruiter_response_rate": signals.recruiter_response_rate,
            "redrob_avg_response_time_hours": signals.avg_response_time_hours,
            "redrob_profile_views_30d": signals.profile_views_received_30d,
            "redrob_applications_30d": signals.applications_submitted_30d,
            "redrob_search_appearances_30d": signals.search_appearance_30d,
            "redrob_saved_by_recruiters_30d": signals.saved_by_recruiters_30d,
            "redrob_interview_completion_rate": signals.interview_completion_rate,
            "redrob_offer_acceptance_rate": signals.offer_acceptance_rate,
            "redrob_github_activity_score": signals.github_activity_score,
            "redrob_has_verified_contact": signals.verified_email and signals.verified_phone,
            "redrob_days_active": days_active,
            "redrob_high_engagement_ratio": high_engagement,
        }

    def _extract_skill_depth(self, candidate: Candidate) -> dict[str, Any]:
        proficiency_weights = {
            "beginner": 0.5,
            "intermediate": 1.0,
            "advanced": 1.5,
            "expert": 2.0,
        }
        raw_scores = []
        proficiency_totals: dict[str, float] = {level: 0.0 for level in proficiency_weights}
        deep_skill_count = 0

        for skill in candidate.skills:
            prof = skill.proficiency.lower() if skill.proficiency else ""
            weight = proficiency_weights.get(prof, 0.0)
            duration = self._safe_int(skill.duration_months)
            endorsements = self._safe_int(skill.endorsements)
            score = weight * duration + endorsements * 0.2
            raw_scores.append(score)
            if prof in {"advanced", "expert"}:
                deep_skill_count += 1
            proficiency_totals[prof] += score

        total_depth_score = round(sum(raw_scores), 2)
        average_depth_score = round(sum(raw_scores) / len(raw_scores), 2) if raw_scores else 0.0

        return {
            "skill_depth_score": total_depth_score,
            "skill_depth_average_score": average_depth_score,
            "skill_deep_count": deep_skill_count,
            "skill_depth_expert_score": round(proficiency_totals.get("expert", 0.0), 2),
            "skill_depth_advanced_score": round(proficiency_totals.get("advanced", 0.0), 2),
        }

    def _skill_to_category(self, skill_name: str) -> str:
        normalized = normalize_string(skill_name.lower())
        category_keywords = {
            "ai_ml": ["nlp", "ml", "machine learning", "deep learning", "llm", "model", "tensorflow", "pytorch", "scikit", "computer vision", "image recognition", "speech recognition", "fine-tuning"],
            "data": ["data", "spark", "sql", "dbt", "airflow", "warehouse", "etl", "bigquery", "snowflake", "hive", "analytics", "pipeline"],
            "cloud": ["aws", "gcp", "azure", "cloud", "docker", "kubernetes", "lambda", "s3", "ecs", "eks"],
            "software": ["python", "java", "c++", "c#", "javascript", "node", "flask", "django", "rest", "api", "backend", "frontend", "react", "angular"],
            "devops": ["ci/cd", "jenkins", "terraform", "ansible", "kubernetes", "docker", "devops"],
            "design": ["ux", "ui", "figma", "photoshop", "illustrator", "design", "adobe"],
            "business": ["management", "leadership", "sales", "marketing", "finance", "strategy", "analyst", "accounting"],
        }
        for category, keywords in category_keywords.items():
            if any(keyword in normalized for keyword in keywords):
                return category
        return "other"

    def _extract_skill_diversity(self, candidate: Candidate) -> dict[str, Any]:
        categories = [self._skill_to_category(entry.name) for entry in candidate.skills if entry.name]
        category_counts = Counter(categories)
        unique_categories = len(category_counts)
        unique_skills = len({normalize_string(entry.name).lower() for entry in candidate.skills if entry.name})

        entropy = 0.0
        total = sum(category_counts.values())
        if total:
            for count in category_counts.values():
                p = count / total
                entropy -= p * math.log(p, 2)

        return {
            "skill_diversity_category_count": unique_categories,
            "skill_diversity_unique_skills": unique_skills,
            "skill_diversity_entropy": round(entropy, 3),
            "skill_diversity_category_counts": dict(category_counts),
        }

    def _extract_career_progression(self, candidate: Candidate) -> dict[str, Any]:
        title_levels = {
            "intern": 1,
            "associate": 2,
            "analyst": 3,
            "engineer": 4,
            "developer": 4,
            "specialist": 4,
            "consultant": 4,
            "senior": 5,
            "lead": 6,
            "manager": 7,
            "director": 8,
            "vp": 9,
            "vice president": 9,
            "chief": 10,
            "head": 9,
        }

        def title_level(title: str) -> int:
            normalized = normalize_string(title.lower())
            level = 0
            for keyword, value in title_levels.items():
                if keyword in normalized:
                    level = max(level, value)
            return level

        levels = [title_level(entry.title) for entry in candidate.career_history if entry.title]
        promotions = 0
        for earlier, later in zip(levels, levels[1:]):
            if later > earlier:
                promotions += 1

        current_level = levels[-1] if levels else 0
        initial_level = levels[0] if levels else 0
        level_change = current_level - initial_level
        progression_ratio = round(promotions / max(1, len(levels) - 1), 3) if len(levels) > 1 else 0.0

        return {
            "career_progression_initial_level": initial_level,
            "career_progression_current_level": current_level,
            "career_progression_level_change": level_change,
            "career_progression_promotion_count": promotions,
            "career_progression_ratio": progression_ratio,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 2 feature engineering for validated candidate data.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Path to the validated candidate JSONL file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path to write extracted Phase 2 features JSONL.",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA_PATH,
        help="Path to the Phase 1 candidate JSON schema.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level for the feature extraction job.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logger = logging.getLogger(LOGGER_NAME)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(DEFAULT_LOG_FORMAT))
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, args.log_level.upper(), logging.INFO))

    engine = Phase2FeatureEngineering(schema_path=args.schema, logger=logger)
    try:
        processed, skipped, feature_count, elapsed_seconds = engine.run(args.input, args.output)
        if skipped > 0:
            logger.warning("Phase 2 completed with skipped records: %d", skipped)
        return 0 if processed > 0 and skipped == 0 else 1
    except Exception as exc:
        logger.exception("Fatal error during Phase 2 execution: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
