from __future__ import annotations

import argparse
import json
import logging
import math
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

LOGGER_NAME = "prism.phase3"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DEFAULT_INPUT_PATH = OUTPUTS_DIR / "phase2_features.jsonl"
DEFAULT_OUTPUT_PATH = OUTPUTS_DIR / "phase3_intelligence.jsonl"


@dataclass
class IntelligenceProfile:
    candidate_id: str
    intelligence: dict[str, Any]


class Phase3CandidateIntelligence:
    def __init__(self, logger: logging.Logger | None = None) -> None:
        self.logger = logger or self._get_logger()

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
        self.logger.info("Starting Phase 3 candidate intelligence engine")
        start_ts = time.monotonic()

        processed = 0
        skipped = 0
        metric_count = 0

        with input_path.open("r", encoding="utf-8") as stream, output_path.open("w", encoding="utf-8", newline="") as out_stream:
            for line_number, raw_line in enumerate(stream, start=1):
                raw_line = raw_line.rstrip("\n")
                if not raw_line.strip():
                    self.logger.debug("Skipping empty line %s", line_number)
                    continue

                try:
                    record = json.loads(raw_line)
                    candidate_id = record.get("candidate_id")
                    features = record.get("features", {})
                    if not candidate_id or not isinstance(features, dict):
                        raise ValueError("Missing candidate_id or features")

                    intelligence = self.extract_intelligence(features)
                    metric_count = len(intelligence)
                    output = IntelligenceProfile(candidate_id=candidate_id, intelligence=intelligence)
                    out_stream.write(json.dumps(output.__dict__, ensure_ascii=False) + "\n")
                    processed += 1
                except Exception as exc:
                    skipped += 1
                    self.logger.warning("Line %s: skipped due to error: %s", line_number, exc)
                    self.logger.debug("Raw line: %s", raw_line)

        elapsed = time.monotonic() - start_ts
        self.logger.info("Phase 3 complete")
        self.logger.info("Candidates processed: %d", processed)
        self.logger.info("Candidates skipped: %d", skipped)
        self.logger.info("Metrics generated per candidate: %d", 8)
        self.logger.info("Processing time: %.2f seconds", elapsed)
        self.logger.info("Output file: %s", output_path)

        return processed, skipped, 8, int(elapsed)

    def extract_intelligence(self, features: dict[str, Any]) -> dict[str, Any]:
        intelligence: dict[str, Any] = {}
        intelligence["candidate_dna_profile"] = self._candidate_dna_profile(features)
        intelligence["career_momentum_index"] = self._career_momentum_index(features)
        intelligence["career_stability_score"] = self._career_stability_score(features)
        intelligence["recruiter_attraction_score"] = self._recruiter_attraction_score(features)
        intelligence["profile_trust_score"] = self._profile_trust_score(features)
        intelligence["market_readiness_score"] = self._market_readiness_score(features)
        intelligence["anti_skill_stuffing_detection"] = self._anti_skill_stuffing_detection(features)
        intelligence["feature_completeness"] = self._feature_completeness(features)
        return intelligence

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _safe_int(self, value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _candidate_dna_profile(self, features: dict[str, Any]) -> dict[str, Any]:
        skill_count = self._safe_int(features.get("skill_total_count"))
        expert_count = self._safe_int(features.get("skill_expert_count"))
        advanced_count = self._safe_int(features.get("skill_advanced_count"))
        deep_skill_ratio = round((expert_count + advanced_count) / max(1, skill_count), 3)
        career_roles = self._safe_int(features.get("career_num_roles"))
        unique_companies = self._safe_int(features.get("career_unique_companies"))
        unique_industries = self._safe_int(features.get("career_unique_industries"))
        dna_type = "balanced"
        if deep_skill_ratio >= 0.5 and career_roles <= 3:
            dna_type = "specialist"
        elif deep_skill_ratio < 0.25 and career_roles >= 4:
            dna_type = "generalist"

        return {
            "deep_skill_ratio": deep_skill_ratio,
            "career_breadth": career_roles,
            "company_breadth": unique_companies,
            "industry_breadth": unique_industries,
            "dna_type": dna_type,
        }

    def _career_momentum_index(self, features: dict[str, Any]) -> dict[str, Any]:
        years_experience = self._safe_float(features.get("profile_years_of_experience"))
        promotions = self._safe_int(features.get("career_progression_promotion_count"))
        current_duration = self._safe_int(features.get("current_role_duration_months"))
        level_change = self._safe_int(features.get("career_progression_level_change"))
        momentum = round((promotions * 1.5 + max(0, level_change) * 1.2 + max(0, years_experience / max(1, current_duration))) , 3)
        return {
            "momentum_promotions": promotions,
            "momentum_level_change": level_change,
            "momentum_current_role_duration_months": current_duration,
            "momentum_years_experience": years_experience,
            "momentum_index": momentum,
        }

    def _career_stability_score(self, features: dict[str, Any]) -> dict[str, Any]:
        career_years_since_first_role = self._safe_float(features.get("career_years_since_first_role"))
        role_count = self._safe_int(features.get("career_num_roles"))
        avg_duration = self._safe_float(features.get("career_average_duration_months"))
        if role_count <= 1:
            stability = 0.0
        else:
            stability = round(min(1.0, avg_duration / max(1, 24) + career_years_since_first_role / max(1, role_count * 5)), 3)
        return {
            "stability_role_count": role_count,
            "stability_avg_duration_months": avg_duration,
            "stability_years_since_first_role": career_years_since_first_role,
            "stability_score": stability,
        }

    def _recruiter_attraction_score(self, features: dict[str, Any]) -> dict[str, Any]:
        profile_completeness = self._safe_float(features.get("redrob_profile_completeness_score"))
        recruiter_response_rate = self._safe_float(features.get("redrob_recruiter_response_rate"))
        search_appearances = self._safe_int(features.get("redrob_search_appearances_30d"))
        saves = self._safe_int(features.get("redrob_saved_by_recruiters_30d"))
        views = self._safe_int(features.get("redrob_profile_views_30d"))
        engagement = round((search_appearances * 0.3 + saves * 0.5 + views * 0.2) / max(1, search_appearances + saves + views), 3)
        return {
            "recruiter_profile_completeness": profile_completeness,
            "recruiter_response_rate": recruiter_response_rate,
            "recruiter_search_appearances_30d": search_appearances,
            "recruiter_saved_by_recruiters_30d": saves,
            "recruiter_profile_views_30d": views,
            "recruiter_engagement_ratio": engagement,
        }

    def _profile_trust_score(self, features: dict[str, Any]) -> dict[str, Any]:
        has_verified_contact = bool(features.get("redrob_has_verified_contact"))
        completeness = self._safe_float(features.get("redrob_profile_completeness_score"))
        avg_response_hours = self._safe_float(features.get("redrob_avg_response_time_hours"))
        interview_completion = self._safe_float(features.get("redrob_interview_completion_rate"))
        trust = round((0.3 * (completeness / 100) + 0.3 * has_verified_contact + 0.2 * min(1, interview_completion) + 0.2 * max(0, 1 - min(1, avg_response_hours / 168))), 3)
        return {
            "trust_verified_contact": has_verified_contact,
            "trust_profile_completeness": completeness,
            "trust_avg_response_time_hours": avg_response_hours,
            "trust_interview_completion_rate": interview_completion,
            "trust_score": trust,
        }

    def _market_readiness_score(self, features: dict[str, Any]) -> dict[str, Any]:
        skill_count = self._safe_int(features.get("skill_total_count"))
        skill_depth = self._safe_float(features.get("skill_depth_score"))
        open_to_work = bool(features.get("redrob_open_to_work"))
        offer_acceptance = self._safe_float(features.get("redrob_offer_acceptance_rate"))
        readiness = round((0.25 * min(1, skill_count / 10) + 0.25 * min(1, skill_depth / 100) + 0.25 * float(open_to_work) + 0.25 * min(1, max(0, (offer_acceptance + 1) / 2))), 3)
        return {
            "market_skill_count": skill_count,
            "market_skill_depth": skill_depth,
            "market_open_to_work": open_to_work,
            "market_offer_acceptance_rate": offer_acceptance,
            "market_readiness_score": readiness,
        }

    def _anti_skill_stuffing_detection(self, features: dict[str, Any]) -> dict[str, Any]:
        total_skills = self._safe_int(features.get("skill_total_count"))
        average_endorsements = self._safe_float(features.get("skill_avg_endorsements"))
        advanced_count = self._safe_int(features.get("skill_advanced_count"))
        expert_count = self._safe_int(features.get("skill_expert_count"))
        deep_skill_total = advanced_count + expert_count
        stuffing_ratio = 0.0
        if total_skills:
            stuffing_ratio = round((total_skills - deep_skill_total) / total_skills, 3)
        stuffing_flag = stuffing_ratio > 0.75 and average_endorsements < 5
        return {
            "anti_skill_stuffing_total_skills": total_skills,
            "anti_skill_stuffing_deep_skill_total": deep_skill_total,
            "anti_skill_stuffing_ratio": stuffing_ratio,
            "anti_skill_stuffing_flag": stuffing_flag,
        }

    def _feature_completeness(self, features: dict[str, Any]) -> dict[str, Any]:
        reported_metrics = len([value for value in features.values() if value is not None])
        return {
            "feature_completeness_reported": reported_metrics,
            "feature_completeness_total": len(features),
            "feature_completeness_ratio": round(reported_metrics / max(1, len(features)), 3),
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 3 candidate intelligence engine.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Path to Phase 2 feature JSONL input.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path to write Phase 3 intelligence JSONL output.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level for Phase 3.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logger = logging.getLogger(LOGGER_NAME)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(DEFAULT_LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, args.log_level.upper(), logging.INFO))

    engine = Phase3CandidateIntelligence(logger=logger)
    try:
        processed, skipped, metric_count, elapsed_seconds = engine.run(args.input, args.output)
        if skipped > 0:
            logger.warning("Phase 3 completed with skipped candidates: %d", skipped)
        return 0 if processed > 0 and skipped == 0 else 1
    except Exception as exc:
        logger.exception("Fatal error during Phase 3 execution: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
