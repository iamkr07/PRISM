from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import jsonschema
    from jsonschema import Draft7Validator
except ImportError as exc:
    raise ImportError(
        "The Phase 1 data foundation pipeline requires the 'jsonschema' package. "
        "Install it with `pip install jsonschema` before running this module."
    ) from exc


LOGGER_NAME = "prism.phase1"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DEFAULT_INPUT_PATH = DATA_DIR / "candidates.jsonl"
DEFAULT_SCHEMA_PATH = DATA_DIR / "candidate_schema.json"
DEFAULT_OUTPUT_PATH = OUTPUTS_DIR / "validated_candidates.jsonl"


@dataclass
class InvalidCandidateRecord:
    line_number: int
    errors: list[str]
    raw_line: str


@dataclass
class CandidateProfile:
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


@dataclass
class CareerEntry:
    company: str
    title: str
    start_date: str
    end_date: str | None
    duration_months: int
    is_current: bool
    industry: str
    company_size: str
    description: str


@dataclass
class EducationEntry:
    institution: str
    degree: str
    field_of_study: str
    start_year: int
    end_year: int
    grade: str | None
    tier: str


@dataclass
class SkillEntry:
    name: str
    proficiency: str
    endorsements: int
    duration_months: int | None


@dataclass
class CertificationEntry:
    name: str
    issuer: str
    year: int


@dataclass
class LanguageEntry:
    language: str
    proficiency: str


@dataclass
class ExpectedSalaryRange:
    min: float
    max: float


@dataclass
class RedrobSignals:
    profile_completeness_score: float
    signup_date: str
    last_active_date: str
    open_to_work_flag: bool
    profile_views_received_30d: int
    applications_submitted_30d: int
    recruiter_response_rate: float
    avg_response_time_hours: float
    skill_assessment_scores: dict[str, float]
    connection_count: int
    endorsements_received: int
    notice_period_days: int
    expected_salary_range_inr_lpa: ExpectedSalaryRange
    preferred_work_mode: str
    willing_to_relocate: bool
    github_activity_score: float
    search_appearance_30d: int
    saved_by_recruiters_30d: int
    interview_completion_rate: float
    offer_acceptance_rate: float
    verified_email: bool
    verified_phone: bool
    linkedin_connected: bool


@dataclass
class Candidate:
    candidate_id: str
    profile: CandidateProfile
    career_history: list[CareerEntry]
    education: list[EducationEntry]
    skills: list[SkillEntry]
    certifications: list[CertificationEntry]
    languages: list[LanguageEntry]
    redrob_signals: RedrobSignals

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "profile": self.profile.__dict__,
            "career_history": [entry.__dict__ for entry in self.career_history],
            "education": [entry.__dict__ for entry in self.education],
            "skills": [entry.__dict__ for entry in self.skills],
            "certifications": [entry.__dict__ for entry in self.certifications],
            "languages": [entry.__dict__ for entry in self.languages],
            "redrob_signals": {
                **{k: v for k, v in self.redrob_signals.__dict__.items() if k != "expected_salary_range_inr_lpa"},
                "expected_salary_range_inr_lpa": self.redrob_signals.expected_salary_range_inr_lpa.__dict__,
            },
        }


def get_logger(level: str | int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(LOGGER_NAME)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(DEFAULT_LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(level)
    return logger


def normalize_string(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value.strip())
    return cleaned


def normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        return normalize_string(value)
    if isinstance(value, dict):
        return {normalize_string(str(key)): normalize_value(val) for key, val in value.items()}
    if isinstance(value, list):
        return [normalize_value(item) for item in value]
    return value


def load_jsonl(path: Path, logger: logging.Logger) -> list[tuple[int, dict[str, Any], str]]:
    records: list[tuple[int, dict[str, Any], str]] = []
    with path.open("r", encoding="utf-8") as stream:
        for line_number, raw_line in enumerate(stream, start=1):
            raw_line = raw_line.rstrip("\n")
            if not raw_line.strip():
                logger.debug("Skipping empty line %s", line_number)
                continue
            try:
                record = json.loads(raw_line)
                if not isinstance(record, dict):
                    raise ValueError("Record must be a JSON object")
                records.append((line_number, record, raw_line))
            except json.JSONDecodeError as exc:
                logger.warning("Line %s: JSON parsing failed: %s", line_number, exc)
            except ValueError as exc:
                logger.warning("Line %s: malformed candidate record: %s", line_number, exc)
    return records


class Phase1DataFoundation:
    def __init__(self, schema_path: Path, logger: logging.Logger | None = None) -> None:
        self.logger = logger or get_logger()
        self.schema = self._load_schema(schema_path)
        self.validator = Draft7Validator(self.schema)

    def _load_schema(self, schema_path: Path) -> dict[str, Any]:
        self.logger.info("Loading schema from %s", schema_path)
        with schema_path.open("r", encoding="utf-8") as schema_file:
            schema = json.load(schema_file)
        self.logger.debug("Schema loaded with title: %s", schema.get("title"))
        return schema

    def validate_record(self, record: dict[str, Any], line_number: int) -> list[str]:
        errors = []
        for error in self.validator.iter_errors(record):
            path = ".".join(str(part) for part in error.absolute_path)
            message = f"{path or 'record'}: {error.message}"
            errors.append(message)
        return errors

    def normalize_record(self, record: dict[str, Any]) -> dict[str, Any]:
        return normalize_value(record)

    def build_candidate(self, record: dict[str, Any]) -> Candidate:
        profile_data = record["profile"]
        profile = CandidateProfile(
            anonymized_name=profile_data["anonymized_name"],
            headline=profile_data["headline"],
            summary=profile_data["summary"],
            location=profile_data["location"],
            country=profile_data["country"],
            years_of_experience=float(profile_data["years_of_experience"]),
            current_title=profile_data["current_title"],
            current_company=profile_data["current_company"],
            current_company_size=profile_data["current_company_size"],
            current_industry=profile_data["current_industry"],
        )

        career_history = [
            CareerEntry(
                company=entry["company"],
                title=entry["title"],
                start_date=entry["start_date"],
                end_date=entry.get("end_date"),
                duration_months=int(entry["duration_months"]),
                is_current=bool(entry["is_current"]),
                industry=entry["industry"],
                company_size=entry["company_size"],
                description=entry["description"],
            )
            for entry in record.get("career_history", [])
        ]

        education = [
            EducationEntry(
                institution=entry["institution"],
                degree=entry["degree"],
                field_of_study=entry["field_of_study"],
                start_year=int(entry["start_year"]),
                end_year=int(entry["end_year"]),
                grade=entry.get("grade"),
                tier=entry["tier"],
            )
            for entry in record.get("education", [])
        ]

        skills = [
            SkillEntry(
                name=entry["name"],
                proficiency=entry["proficiency"],
                endorsements=int(entry["endorsements"]),
                duration_months=entry.get("duration_months"),
            )
            for entry in record.get("skills", [])
        ]

        certifications = [
            CertificationEntry(
                name=item["name"],
                issuer=item["issuer"],
                year=int(item["year"]),
            )
            for item in record.get("certifications", [])
        ]

        languages = [
            LanguageEntry(
                language=item["language"],
                proficiency=item["proficiency"],
            )
            for item in record.get("languages", [])
        ]

        signals = record["redrob_signals"]
        expected_salary = signals["expected_salary_range_inr_lpa"]
        redrob_signals = RedrobSignals(
            profile_completeness_score=float(signals["profile_completeness_score"]),
            signup_date=signals["signup_date"],
            last_active_date=signals["last_active_date"],
            open_to_work_flag=bool(signals["open_to_work_flag"]),
            profile_views_received_30d=int(signals["profile_views_received_30d"]),
            applications_submitted_30d=int(signals["applications_submitted_30d"]),
            recruiter_response_rate=float(signals["recruiter_response_rate"]),
            avg_response_time_hours=float(signals["avg_response_time_hours"]),
            skill_assessment_scores={
                normalize_string(str(k)): float(v) for k, v in signals.get("skill_assessment_scores", {}).items()
            },
            connection_count=int(signals["connection_count"]),
            endorsements_received=int(signals["endorsements_received"]),
            notice_period_days=int(signals["notice_period_days"]),
            expected_salary_range_inr_lpa=ExpectedSalaryRange(
                min=float(expected_salary["min"]),
                max=float(expected_salary["max"]),
            ),
            preferred_work_mode=signals["preferred_work_mode"],
            willing_to_relocate=bool(signals["willing_to_relocate"]),
            github_activity_score=float(signals["github_activity_score"]),
            search_appearance_30d=int(signals["search_appearance_30d"]),
            saved_by_recruiters_30d=int(signals["saved_by_recruiters_30d"]),
            interview_completion_rate=float(signals["interview_completion_rate"]),
            offer_acceptance_rate=float(signals["offer_acceptance_rate"]),
            verified_email=bool(signals["verified_email"]),
            verified_phone=bool(signals["verified_phone"]),
            linkedin_connected=bool(signals["linkedin_connected"]),
        )

        return Candidate(
            candidate_id=normalize_string(record["candidate_id"]).upper(),
            profile=profile,
            career_history=career_history,
            education=education,
            skills=skills,
            certifications=certifications,
            languages=languages,
            redrob_signals=redrob_signals,
        )

    def ingest(self, jsonl_path: Path) -> tuple[list[Candidate], list[InvalidCandidateRecord]]:
        self.logger.info("Ingesting candidates from %s", jsonl_path)
        raw_records = load_jsonl(jsonl_path, self.logger)
        valid_candidates: list[Candidate] = []
        invalid_candidates: list[InvalidCandidateRecord] = []

        for line_number, record, raw_line in raw_records:
            normalized = self.normalize_record(record)
            errors = self.validate_record(normalized, line_number)
            if errors:
                invalid_candidates.append(InvalidCandidateRecord(line_number=line_number, errors=errors, raw_line=raw_line))
                self.logger.warning(
                    "Line %s: rejected candidate %s with %d validation error(s)",
                    line_number,
                    normalized.get("candidate_id", "<unknown>"),
                    len(errors),
                )
                for error in errors:
                    self.logger.debug("Line %s validation error: %s", line_number, error)
                continue

            try:
                candidate = self.build_candidate(normalized)
                valid_candidates.append(candidate)
            except Exception as exc:
                invalid_candidates.append(
                    InvalidCandidateRecord(
                        line_number=line_number,
                        errors=[f"Failed to build candidate object: {exc}"],
                        raw_line=raw_line,
                    )
                )
                self.logger.warning("Line %s: failed to construct Candidate object: %s", line_number, exc)

        self.logger.info(
            "Ingestion complete: %s valid candidate(s), %s invalid candidate(s)",
            len(valid_candidates),
            len(invalid_candidates),
        )
        return valid_candidates, invalid_candidates

    def write_validated_jsonl(self, candidates: list[Candidate], output_path: Path) -> None:
        self.logger.info("Writing %s validated candidate(s) to %s", len(candidates), output_path)
        with output_path.open("w", encoding="utf-8", newline="") as stream:
            for candidate in candidates:
                stream.write(json.dumps(candidate.to_dict(), ensure_ascii=False) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 1 data foundation: ingest and validate candidate records.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Path to the candidate JSONL input file.",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA_PATH,
        help="Path to the JSON schema file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Output path for validated normalized candidate JSONL.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ERROR).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logger = get_logger(getattr(logging, args.log_level.upper(), logging.INFO))

    logger.info("Starting Phase 1 data foundation pipeline")
    start_ts = time.monotonic()

    try:
        pipeline = Phase1DataFoundation(schema_path=args.schema, logger=logger)
        candidates, invalid_candidates = pipeline.ingest(args.input)

        output_path = args.output
        if candidates:
            pipeline.write_validated_jsonl(candidates, output_path)

        total_records = len(candidates) + len(invalid_candidates)
        valid_count = len(candidates)
        invalid_count = len(invalid_candidates)
        elapsed_seconds = time.monotonic() - start_ts

        logger.info("Phase 1 complete")
        logger.info("Total records processed: %d", total_records)
        logger.info("Valid records: %d", valid_count)
        logger.info("Invalid records: %d", invalid_count)
        logger.info("Processing time: %.2f seconds", elapsed_seconds)
        logger.info("Output file: %s", output_path if valid_count else "No valid records to write")

        return 0 if invalid_count == 0 else 1
    except Exception as exc:
        elapsed_seconds = time.monotonic() - start_ts
        logger.exception("Fatal error during Phase 1 execution: %s", exc)
        logger.info("Processing time before failure: %.2f seconds", elapsed_seconds)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
