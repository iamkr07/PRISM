from __future__ import annotations

import argparse
import csv
import json
import logging
import platform
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

LOGGER_NAME = "prism.phase6"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
CONFIG_DIR = PROJECT_ROOT / "config"
DEFAULT_RANKED_INPUT = OUTPUTS_DIR / "phase4_ranked_candidates.jsonl"
DEFAULT_EXPLANATIONS_INPUT = OUTPUTS_DIR / "phase5_explanations.jsonl"
DEFAULT_SUBMISSION_CSV = OUTPUTS_DIR / "submission.csv"
DEFAULT_METADATA_TEMPLATE = CONFIG_DIR / "submission_metadata_template.yaml"
DEFAULT_METADATA_OUTPUT = OUTPUTS_DIR / "submission_metadata.yaml"
DEFAULT_VALIDATE_SCRIPT = PROJECT_ROOT / "validate_submission.py"
REQUIRED_HEADER = ["candidate_id", "rank", "score", "reasoning"]
PLACEHOLDER_REGEX = re.compile(r"your-team-name-here|Full Name|primary@example\.com|YOUR_USERNAME|YOUR_REPO|HuggingFace|YOUR_TEAM_NAME|https://github\.com/YOUR_USERNAME/YOUR_REPO|https://huggingface\.co/spaces/YOUR_USERNAME/redrob-ranker", re.IGNORECASE)


class Phase6ValidationFinalSubmission:
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

    def run(
        self,
        ranked_input: Path,
        explanations_input: Path,
        submission_output: Path,
        metadata_template: Path,
        metadata_output: Path,
        validate_script: Path,
    ) -> tuple[int, int, bool, list[str], float]:
        self.logger.info("Starting Phase 6 validation and final submission generation")
        start_ts = time.monotonic()

        ranked_candidates = self._load_ranked_candidates(ranked_input)
        explanations = self._load_explanations(explanations_input)
        submission_candidates = self._select_top_candidates(ranked_candidates, explanations)
        self._write_submission_csv(submission_candidates, submission_output)

        validation_pass, validation_output = self._validate_submission(validate_script, submission_output)
        metadata_warnings = self._create_submission_metadata(metadata_template, metadata_output)

        warnings: list[str] = []
        if not validation_pass:
            warnings.append("Submission validation failed.")
            warnings.extend(validation_output.splitlines())
        warnings.extend(metadata_warnings)

        elapsed = time.monotonic() - start_ts
        self.logger.info("Phase 6 complete")
        self.logger.info("Top candidates submitted: %d", len(submission_candidates))
        self.logger.info("Validation status: %s", "PASS" if validation_pass else "FAIL")
        self.logger.info("Submission file: %s", submission_output)
        self.logger.info("Metadata file: %s", metadata_output)

        return len(ranked_candidates), len(submission_candidates), validation_pass, warnings, elapsed

    def _load_ranked_candidates(self, path: Path) -> list[tuple[str, float]]:
        candidates: list[tuple[str, float]] = []
        with path.open("r", encoding="utf-8") as stream:
            for line_number, raw_line in enumerate(stream, start=1):
                raw_line = raw_line.rstrip("\n")
                if not raw_line.strip():
                    continue
                try:
                    record = json.loads(raw_line)
                    candidate_id = record["candidate_id"]
                    score = float(record["score"])
                    candidates.append((candidate_id, score))
                except Exception as exc:
                    self.logger.warning("Ranked input line %s skipped: %s", line_number, exc)
        if not candidates:
            raise ValueError(f"No ranked candidates loaded from {path}")
        return candidates

    def _load_explanations(self, path: Path) -> dict[str, str]:
        explanations: dict[str, str] = {}
        with path.open("r", encoding="utf-8") as stream:
            for line_number, raw_line in enumerate(stream, start=1):
                raw_line = raw_line.rstrip("\n")
                if not raw_line.strip():
                    continue
                try:
                    record = json.loads(raw_line)
                    candidate_id = record["candidate_id"]
                    explanation = record.get("explanation", "")
                    explanations[candidate_id] = explanation
                except Exception as exc:
                    self.logger.warning("Explanations input line %s skipped: %s", line_number, exc)
        if not explanations:
            raise ValueError(f"No explanations loaded from {path}")
        return explanations

    def _select_top_candidates(
        self,
        ranked_candidates: list[tuple[str, float]],
        explanations: dict[str, str],
    ) -> list[tuple[str, float, str]]:
        ranked_candidates.sort(key=lambda item: (-item[1], item[0]))
        top_candidates = ranked_candidates[:100]
        if len(top_candidates) < 100:
            raise ValueError("Ranked input contains fewer than 100 candidates.")

        submission_rows: list[tuple[str, float, str]] = []
        for candidate_id, score in top_candidates:
            explanation = explanations.get(candidate_id)
            if explanation is None:
                raise ValueError(f"Missing explanation for candidate_id {candidate_id}")
            submission_rows.append((candidate_id, score, explanation))

        self._assert_non_increasing_scores(submission_rows)
        self._assert_unique_ranks(len(submission_rows))

        return submission_rows

    def _assert_non_increasing_scores(self, rows: list[tuple[str, float, str]]) -> None:
        for i in range(len(rows) - 1):
            if rows[i][1] < rows[i + 1][1]:
                raise ValueError(
                    f"Scores must be non-increasing by rank: rank {i + 1} ({rows[i][1]}) < rank {i + 2} ({rows[i + 1][1]})"
                )

    def _assert_unique_ranks(self, count: int) -> None:
        if count != 100:
            raise ValueError("Submission must contain exactly 100 ranked candidates.")

    def _write_submission_csv(self, rows: list[tuple[str, float, str]], output_path: Path) -> None:
        with output_path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.writer(stream)
            writer.writerow(REQUIRED_HEADER)
            for rank, (candidate_id, score, explanation) in enumerate(rows, start=1):
                writer.writerow([candidate_id, str(rank), self._format_score(score), explanation])

    def _format_score(self, score: float) -> str:
        formatted = f"{score:.4f}".rstrip("0").rstrip(".")
        return formatted

    def _validate_submission(self, validate_script: Path, submission_csv: Path) -> tuple[bool, str]:
        command = [sys.executable, str(validate_script), str(submission_csv)]
        result = subprocess.run(command, capture_output=True, text=True, cwd=PROJECT_ROOT)
        output = result.stdout.strip() + ("\n" + result.stderr.strip() if result.stderr.strip() else "")
        return result.returncode == 0, output.strip()

    def _create_submission_metadata(self, template_path: Path, metadata_path: Path) -> list[str]:
        if not template_path.exists():
            raise FileNotFoundError(f"Metadata template not found: {template_path}")

        content = template_path.read_text(encoding="utf-8")
        content = self._update_metadata_content(content)
        metadata_path.write_text(content, encoding="utf-8")
        return self._scan_metadata_for_placeholders(content)

    def _update_metadata_content(self, content: str) -> str:
        replacements = {
            r'^reproduce_command:.*$': 'reproduce_command: "python run_prism_pipeline.py"',
            r'^  platform:.*$': f'  platform: "{platform.platform()}"',
            r'^  cpu_cores:.*$': f'  cpu_cores: {self._safe_cpu_count()}',
            r'^  python_version:.*$': f'  python_version: "{platform.python_version()}"',
            r'^  os:.*$': f'  os: "{platform.system()} {platform.release()}"',
        }
        for pattern, replacement in replacements.items():
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        return content

    def _safe_cpu_count(self) -> int:
        try:
            import os

            return max(1, (os.cpu_count() or 1))
        except Exception:
            return 1

    def _scan_metadata_for_placeholders(self, content: str) -> list[str]:
        warnings: list[str] = []
        for line_number, line in enumerate(content.splitlines(), start=1):
            if PLACEHOLDER_REGEX.search(line):
                warnings.append(f"Metadata placeholder detected on line {line_number}: {line.strip()}")
        return warnings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 6 validation and final submission generator.")
    parser.add_argument(
        "--ranked",
        type=Path,
        default=DEFAULT_RANKED_INPUT,
        help="Path to Phase 4 ranked candidates JSONL input.",
    )
    parser.add_argument(
        "--explanations",
        type=Path,
        default=DEFAULT_EXPLANATIONS_INPUT,
        help="Path to Phase 5 explanations JSONL input.",
    )
    parser.add_argument(
        "--submission",
        type=Path,
        default=DEFAULT_SUBMISSION_CSV,
        help="Path to write final submission CSV.",
    )
    parser.add_argument(
        "--metadata-template",
        type=Path,
        default=DEFAULT_METADATA_TEMPLATE,
        help="Path to submission metadata template YAML.",
    )
    parser.add_argument(
        "--metadata-output",
        type=Path,
        default=DEFAULT_METADATA_OUTPUT,
        help="Path to write populated submission metadata YAML.",
    )
    parser.add_argument(
        "--validate-script",
        type=Path,
        default=DEFAULT_VALIDATE_SCRIPT,
        help="Path to the provided submission validation script.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level for Phase 6.",
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

    engine = Phase6ValidationFinalSubmission(logger=logger)
    try:
        total_processed, top_100, validation_pass, warnings, elapsed = engine.run(
            args.ranked,
            args.explanations,
            args.submission,
            args.metadata_template,
            args.metadata_output,
            args.validate_script,
        )

        print("Total candidates processed:", total_processed)
        print("Top 100 submitted:", top_100)
        print("Validation status:", "PASS" if validation_pass else "FAIL")
        print("Generated deliverables:")
        print(" -", args.submission)
        print(" -", args.metadata_output)
        print(f"Total execution time: {elapsed:.2f} seconds")
        if warnings:
            print("Warnings:")
            for message in warnings:
                print(" -", message)
        return 0 if validation_pass else 1
    except Exception as exc:
        logger.exception("Phase 6 failed: %s", exc)
        print("Fatal error during Phase 6:", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
