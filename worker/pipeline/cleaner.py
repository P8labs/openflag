import os
from typing import List
from bs4 import BeautifulSoup

from config import config
from pipeline.types import CleanedItem, FetchedItem
from utils.logger import get_logger


class Cleaner:
    def __init__(self, run_id: str, local_cache: bool = True):
        self.run_id = run_id
        self.local_cache = local_cache
        self.logger = get_logger()

    def _get_path(self, name: str) -> str:
        safe = name.replace(" ", "_").lower()
        return f"{config.BASE_PATH}/{self.run_id}/cleaned/{safe}.txt"

    def _ensure_dir(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    def clean_html(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(
            [
                "script",
                "style",
                "nav",
                "footer",
                "header",
                "aside",
                "noscript",
                "svg",
                "form",
            ]
        ):
            tag.decompose()

        text = soup.get_text(separator="\n")

        lines = []
        for line in text.splitlines():
            line = line.strip()

            if not line or len(line) < 25:
                continue

            if line.lower() in {"cookies", "accept", "privacy"}:
                continue

            lines.append(line)

        # dedupe
        seen = set()
        final = []
        for line in lines:
            if line not in seen:
                seen.add(line)
                final.append(line)

        return "\n".join(final)

    def run(self, fetched_data: List[FetchedItem]) -> List[CleanedItem]:
        results: List[CleanedItem] = []

        for item in fetched_data:
            self.logger.info(f"[CLEAN] {item.type} → {item.url}")

            cleaned = self.clean_html(item.html)

            if self.local_cache:
                path = self._get_path(item.type)
                self._ensure_dir(path)

                with open(path, "w", encoding="utf-8") as f:
                    f.write(cleaned)

            results.append(CleanedItem(type=item.type, url=item.url, text=cleaned))

        return results

    def combine(self, cleaned_data: List[CleanedItem]) -> str:
        parts = []

        for item in cleaned_data:
            parts.append(f"SOURCE: {item.type} ({item.url})")
            parts.append(item.text)

        return "\n\n".join(parts)
