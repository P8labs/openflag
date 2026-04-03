from utils.logger import get_logger
from pipeline.cleaner import Cleaner
from pipeline.fetcher import Fetcher

from pipeline.stages.stage1 import Stage1
from pipeline.stages.stage2 import Stage2
from pipeline.stages.stage3 import Stage3
from pipeline.stages.stage4 import Stage4
from services.llm import LLMClient


class PipelineRunner:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self.logger = get_logger()

        self.llm = LLMClient()

        self.stage1 = Stage1(run_id, self.llm)
        self.stage2 = Stage2(run_id, self.llm)
        self.stage3 = Stage3(run_id, self.llm)
        self.stage4 = Stage4(run_id)

    def run(self, software: dict, force: bool = False):
        self.logger.info("[PIPELINE] Starting")

        if not software or "urls" not in software:
            raise ValueError("Invalid software input: missing 'urls'")

        if not software["urls"]:
            raise ValueError("No URLs provided")

        fetched = []
        fetcher = Fetcher(self.run_id)

        try:
            self.logger.info("[FETCH] Starting")
            fetched = fetcher.run(software["urls"])

        finally:
            fetcher.close()

        if not fetched:
            raise RuntimeError("Fetch failed: no data retrieved")

        self.logger.info("[CLEAN] Starting")

        cleaner = Cleaner(self.run_id)
        cleaned = cleaner.run(fetched)

        if not cleaned:
            raise RuntimeError("Clean failed: no usable content")

        combined_text = cleaner.combine(cleaned)

        if not combined_text.strip():
            raise RuntimeError("Combined text is empty")

        try:
            stage1 = self.stage1.execute(combined_text, force=force)

            if not stage1.main_points:
                raise RuntimeError("Stage1 returned empty points")

            stage2 = self.stage2.execute(stage1.main_points, force=force)

            stage3 = self.stage3.execute(stage2.model_dump(), force=force)

            stage4 = self.stage4.execute(
                {
                    "stage1": stage1.main_points,
                    "stage2": stage2.model_dump(),
                    "stage3": stage3.model_dump(),
                },
                force=force,
            )

        except Exception as e:
            self.logger.error(f"[PIPELINE] Stage failure [{e}]", exc_info=True)
            raise

        self.logger.info("[PIPELINE] Completed")

        return stage4
