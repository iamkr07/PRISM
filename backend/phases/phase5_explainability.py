from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any

LOGGER_NAME = "prism.phase5"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DEFAULT_INPUT_PATH = OUTPUTS_DIR / "phase4_ranked_candidates.jsonl"
DEFAULT_OUTPUT_PATH = OUTPUTS_DIR / "phase5_explanations.jsonl"
DEFAULT_TOP_K = 100


class Phase5Explainability:
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

    def run(self, input_path: Path, output_path: Path, top_k: int = DEFAULT_TOP_K) -> tuple[int, int, float]:
        self.logger.info("Starting Phase 5 explainability engine")
        start_ts = time.monotonic()

        processed = 0
        generated = 0

        with input_path.open("r", encoding="utf-8") as stream, output_path.open("w", encoding="utf-8", newline="") as out_stream:
            for line_number, raw_line in enumerate(stream, start=1):
                raw_line = raw_line.rstrip("\n")
                if not raw_line.strip():
                    continue
                if processed >= top_k:
                    break

                try:
                    record = json.loads(raw_line)
                    candidate_id = record["candidate_id"]
                    score = record["score"]
                    metrics = record.get("metrics", {})
                    explanation = self.generate_explanation(metrics)
                    output = {
                        "candidate_id": candidate_id,
                        "score": score,
                        "explanation": explanation,
                    }
                    out_stream.write(json.dumps(output, ensure_ascii=False) + "\n")
                    generated += 1
                except Exception as exc:
                    self.logger.warning("Line %s skipped: %s", line_number, exc)
                processed += 1

        elapsed = time.monotonic() - start_ts
        self.logger.info("Phase 5 complete")
        self.logger.info("Total ranked candidates processed: %d", processed)
        self.logger.info("Total reasoning records generated: %d", generated)
        self.logger.info("Processing time: %.2f seconds", elapsed)
        self.logger.info("Output file: %s", output_path)
        return processed, generated, elapsed

    def generate_explanation(self, metrics: dict[str, Any]) -> str:
        signals = self._score_signals(metrics)
        parts = []

        if signals["high_momentum"]:
            parts.append("Strong career momentum driven by promotions and role progression.")
        if signals["high_recruiter_attraction"]:
            parts.append("High recruiter engagement with strong profile views and saved counts.")
        if signals["high_trust"]:
            parts.append("Trusted profile with high completeness and verified contact signals.")
        if signals["high_market_readiness"]:
            parts.append("Market-ready candidate with strong skill readiness and open-to-work availability.")
        if signals["low_skill_stuffing"]:
            parts.append("Skill profile shows strong depth rather than inflated skill counts.")
        if not parts:
            parts.append("Balanced candidate profile with solid momentum and trust signals.")

        return " ".join(parts[:2])

    def _score_signals(self, metrics: dict[str, Any]) -> dict[str, bool]:
        momentum_score = metrics.get("career_momentum_index.momentum_index", 0.0)
        attraction_score = metrics.get("recruiter_attraction_score.recruiter_engagement_ratio", 0.0)
        trust_score = metrics.get("profile_trust_score.trust_score", 0.0)
        readiness_score = metrics.get("market_readiness_score.market_readiness_score", 0.0)
        stuffing_ratio = metrics.get("anti_skill_stuffing_detection.anti_skill_stuffing_ratio", 0.0)

        return {
            "high_momentum": momentum_score >= 1.5,
            "high_recruiter_attraction": attraction_score >= 0.5,
            "high_trust": trust_score >= 0.65,
            "high_market_readiness": readiness_score >= 0.55,
            "low_skill_stuffing": stuffing_ratio <= 0.25,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 5 explainability engine.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Path to Phase 4 ranked candidates JSONL input.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path to write Phase 5 explanations JSONL output.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=DEFAULT_TOP_K,
        help="Number of top candidates to generate explanations for.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level for Phase 5.",
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

    engine = Phase5Explainability(logger=logger)
    try:
        processed, generated, elapsed = engine.run(args.input, args.output, args.top_k)
        return 0 if generated == args.top_k else 1
    except Exception as exc:
        logger.exception("Fatal error during Phase 5 execution: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
