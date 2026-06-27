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

LOGGER_NAME = "prism.phase4"
DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
DEFAULT_INPUT_PATH = OUTPUTS_DIR / "phase3_intelligence.jsonl"
DEFAULT_OUTPUT_PATH = OUTPUTS_DIR / "phase4_ranked_candidates.jsonl"
DEFAULT_WEIGHTS_PATH = PROJECT_ROOT / "phase4_weights.json"

DEFAULT_WEIGHTS = {
    "career_momentum_index": 1.0,
    "career_stability_score": 0.8,
    "recruiter_attraction_score": 1.2,
    "profile_trust_score": 1.0,
    "market_readiness_score": 1.1,
    "anti_skill_stuffing_detection": -0.7,
    "feature_completeness": 0.5,
}


@dataclass
class RankedCandidate:
    candidate_id: str
    score: float
    raw_score: float
    metrics: dict[str, float]


class Phase4SmartRanking:
    def __init__(self, weights: dict[str, float], logger: logging.Logger | None = None) -> None:
        self.logger = logger or self._get_logger()
        self.weights = weights

    def _get_logger(self) -> logging.Logger:
        logger = logging.getLogger(LOGGER_NAME)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(DEFAULT_LOG_FORMAT)
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        return logger

    def load_weights(self, path: Path) -> dict[str, float]:
        if path.exists():
            with path.open("r", encoding="utf-8") as f:
                loaded_weights = json.load(f)
            self.logger.info("Loaded ranking weights from %s", path)
            return {**DEFAULT_WEIGHTS, **loaded_weights}
        self.logger.info("Using default ranking weights")
        return DEFAULT_WEIGHTS

    def run(self, input_path: Path, output_path: Path, weights_path: Path) -> tuple[int, int, int, float]:
        self.weights = self.load_weights(weights_path)
        start_ts = time.monotonic()
        processed = 0
        skipped = 0
        ranked_candidates: list[RankedCandidate] = []

        for line_number, raw_line in enumerate(input_path.open("r", encoding="utf-8"), start=1):
            raw_line = raw_line.rstrip("\n")
            if not raw_line.strip():
                self.logger.debug("Skipping empty line %s", line_number)
                continue
            try:
                record = json.loads(raw_line)
                candidate_id = record["candidate_id"]
                intelligence = record["intelligence"]
                metrics = self._flatten_metrics(intelligence)
                raw_score = self._compute_raw_score(metrics)
                normalized_score = self._normalize_score(raw_score)
                ranked_candidates.append(RankedCandidate(candidate_id=candidate_id, score=normalized_score, raw_score=raw_score, metrics=metrics))
                processed += 1
            except Exception as exc:
                skipped += 1
                self.logger.warning("Line %s skipped: %s", line_number, exc)

        ranked_candidates.sort(key=lambda candidate: (-candidate.score, candidate.candidate_id))
        top_candidates = ranked_candidates[:100]

        with output_path.open("w", encoding="utf-8", newline="") as out_stream:
            for candidate in ranked_candidates:
                out_stream.write(json.dumps({
                    "candidate_id": candidate.candidate_id,
                    "score": candidate.score,
                    "raw_score": candidate.raw_score,
                    "metrics": candidate.metrics,
                }, ensure_ascii=False) + "\n")

        elapsed = time.monotonic() - start_ts
        self.logger.info("Phase 4 complete")
        self.logger.info("Total candidates processed: %d", processed)
        self.logger.info("Total candidates ranked: %d", len(ranked_candidates))
        self.logger.info("Top 100 selected: %d", len(top_candidates))
        self.logger.info("Processing time: %.2f seconds", elapsed)
        self.logger.info("Output file: %s", output_path)
        return processed, len(ranked_candidates), len(top_candidates), elapsed

    def _flatten_metrics(self, intelligence: dict[str, Any]) -> dict[str, float]:
        flat: dict[str, float] = {}
        for category, values in intelligence.items():
            if isinstance(values, dict):
                for key, value in values.items():
                    flat[f"{category}.{key}"] = self._safe_float(value)
            else:
                flat[category] = self._safe_float(values)
        return flat

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _compute_raw_score(self, metrics: dict[str, float]) -> float:
        score = 0.0
        score += self.weights.get("career_momentum_index", 0.0) * metrics.get("career_momentum_index.momentum_index", 0.0)
        score += self.weights.get("career_stability_score", 0.0) * metrics.get("career_stability_score.stability_score", 0.0)
        score += self.weights.get("recruiter_attraction_score", 0.0) * metrics.get("recruiter_attraction_score.recruiter_engagement_ratio", 0.0)
        score += self.weights.get("profile_trust_score", 0.0) * metrics.get("profile_trust_score.trust_score", 0.0)
        score += self.weights.get("market_readiness_score", 0.0) * metrics.get("market_readiness_score.market_readiness_score", 0.0)
        score += self.weights.get("anti_skill_stuffing_detection", 0.0) * (1.0 - metrics.get("anti_skill_stuffing_detection.anti_skill_stuffing_ratio", 0.0))
        score += self.weights.get("feature_completeness", 0.0) * metrics.get("feature_completeness.feature_completeness_ratio", 0.0)
        return score

    def _normalize_score(self, raw_score: float) -> float:
        return round((1 / (1 + math.exp(-raw_score / 10))) * 100, 4)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Phase 4 smart ranking engine.")
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help="Phase 3 intelligence JSONL input.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Phase 4 ranked candidates JSONL output.",
    )
    parser.add_argument(
        "--weights",
        type=Path,
        default=DEFAULT_WEIGHTS_PATH,
        help="Optional JSON file with ranking weight overrides.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level for Phase 4.",
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

    ranking = Phase4SmartRanking(weights=DEFAULT_WEIGHTS, logger=logger)
    try:
        processed, ranked, top_100, elapsed = ranking.run(args.input, args.output, args.weights)
        return 0 if processed > 0 and top_100 == 100 else 1
    except Exception as exc:
        logger.exception("Fatal error during Phase 4 execution: %s", exc)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
