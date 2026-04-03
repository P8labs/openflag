import os
import hashlib
import json
import time
from datetime import datetime
from typing import Dict, List

import httpx

from config import config
from pipeline.types import FetchedItem
from utils.logger import get_logger


class Fetcher:
    def __init__(
        self,
        run_id: str,
        local_cache: bool = True,
        timeout: float = 20.0,
        max_retries: int = 3,
        min_content_length: int = 1000,
    ):
        self.run_id = run_id
        self.local_cache = local_cache
        self.timeout = timeout
        self.max_retries = max_retries
        self.min_content_length = min_content_length

        self.logger = get_logger()

        self.client = httpx.Client(
            timeout=self.timeout,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (OpenFlag Bot)"},
        )

    def _hash_url(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    def _get_raw_path(self, url: str) -> str:
        return f"{config.BASE_PATH}/{self.run_id}/raw/{self._hash_url(url)}.html"

    def _get_meta_path(self, url: str) -> str:
        return f"{config.BASE_PATH}/{self.run_id}/raw/{self._hash_url(url)}.json"

    def _ensure_dir(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    def fetch_url(self, url: str) -> FetchedItem:
        raw_path = self._get_raw_path(url)
        meta_path = self._get_meta_path(url)

        if self.local_cache and os.path.exists(raw_path):
            self.logger.info(f"[FETCH][CACHE] {url}")

            with open(raw_path, "r", encoding="utf-8") as f:
                html = f.read()

            status_code = None
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                        status_code = meta.get("status_code")
                except Exception:
                    pass

            return FetchedItem(
                type="",  # will be set by caller
                url=url,
                html=html,
                status_code=status_code,
                from_cache=True,
            )

        last_error = None

        for attempt in range(self.max_retries):
            try:
                self.logger.info(f"[FETCH] {url} (attempt {attempt + 1})")

                res = self.client.get(url)
                res.raise_for_status()

                html = res.text

                if not html or len(html) < self.min_content_length:
                    raise ValueError("Response too small")

                if self.local_cache:
                    self._ensure_dir(raw_path)

                    with open(raw_path, "w", encoding="utf-8") as f:
                        f.write(html)

                    meta = {
                        "url": url,
                        "status_code": res.status_code,
                        "fetched_at": datetime.utcnow().isoformat(),
                        "content_length": len(html),
                    }

                    with open(meta_path, "w") as f:
                        json.dump(meta, f, indent=2)

                return FetchedItem(
                    type="",
                    url=url,
                    html=html,
                    status_code=res.status_code,
                    from_cache=False,
                )

            except httpx.HTTPStatusError as e:
                last_error = e
                self.logger.warning(f"[FETCH][HTTP] {url} → {e.response.status_code}")

            except httpx.RequestError as e:
                last_error = e
                self.logger.warning(f"[FETCH][NETWORK] {url} → {e}")

            except Exception as e:
                last_error = e
                self.logger.warning(f"[FETCH][ERROR] {url} → {e}")

            time.sleep(2 * (attempt + 1))  # backoff

        raise RuntimeError(f"[FETCH][FAILED] {url}: {last_error}")

    def run(self, urls: Dict[str, str]) -> List[FetchedItem]:
        results: List[FetchedItem] = []

        for key, url in urls.items():
            try:
                item = self.fetch_url(url)
                item.type = key  # assign type here
                results.append(item)

            except Exception as e:
                self.logger.error(f"[FETCH][SKIP] {key} → {url} | {e}")

        return results

    def close(self):
        self.client.close()
