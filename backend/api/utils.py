"""Utilities for reading backend data."""
import json
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional, Iterator
import os


def get_backend_path(filename: str) -> Path:
    """Get path to backend data file.
    
    Args:
        filename: Path relative to backend directory (e.g., 'analytics/prism_insights.json')
    """
    # api/utils.py -> api -> backend
    backend_dir = Path(__file__).parent.parent
    return backend_dir / filename


def read_jsonl_file(filename: str) -> Iterator[Dict[str, Any]]:
    """Read a JSONL file and yield each line as a dict."""
    filepath = get_backend_path(filename)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def read_json_file(filename: str) -> Dict[str, Any]:
    """Read a JSON file."""
    filepath = get_backend_path(filename)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def read_csv_file(filename: str) -> List[Dict[str, str]]:
    """Read a CSV file."""
    filepath = get_backend_path(filename)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return rows


def find_jsonl_entry(filename: str, candidate_id: str) -> Optional[Dict[str, Any]]:
    """Find a specific entry in a JSONL file by candidate_id."""
    try:
        for entry in read_jsonl_file(filename):
            if entry.get('candidate_id') == candidate_id:
                return entry
    except FileNotFoundError:
        pass
    return None


def get_jsonl_entries_batch(filename: str, candidate_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Get multiple entries from a JSONL file."""
    entries = {}
    id_set = set(candidate_ids)
    try:
        for entry in read_jsonl_file(filename):
            if entry.get('candidate_id') in id_set:
                entries[entry['candidate_id']] = entry
                if len(entries) == len(id_set):
                    break
    except FileNotFoundError:
        pass
    return entries
