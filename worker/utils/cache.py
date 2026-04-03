from datetime import datetime
import hashlib
import json
import os
from typing import Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def compute_checksum(data) -> str:
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def load_cache(input_data, path: str, schema: Type[T], logger=None) -> T | None:

    checksum = compute_checksum(input_data)

    if not os.path.exists(path):
        return None

    if logger:
        logger.info("[CACHE] Checking...")

    try:
        with open(path, "r") as f:
            cached = json.load(f)

        if cached.get("checksum") == checksum:
            if logger:
                logger.info("[CACHE] Hit")

            return schema(**cached["data"])

        else:
            if logger:
                logger.info("[CACHE] Miss (input changed)")

    except Exception as e:
        if logger:
            logger.warning(f"[CACHE] Corrupted → recompute: {e}")

    return None


def save_cache(path: str, input_data, result: BaseModel):
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "w") as f:
        json.dump(
            {
                "timestamp": datetime.now().isoformat(),
                "checksum": compute_checksum(input_data),
                "data": result.model_dump(),
            },
            f,
            indent=2,
        )
