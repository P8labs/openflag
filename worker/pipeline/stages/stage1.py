from core import prompts
from services.llm import LLMClient
from .types import Stage1Result
from .base_stage import BaseStage
from utils.chunk import chunk_text


class Stage1(BaseStage[Stage1Result]):
    def __init__(self, run_id: str, llm: LLMClient):
        super().__init__(run_id, "STAGE1", Stage1Result, llm)

    def _run(self, combined_text: str) -> Stage1Result:
        if not self.llm:
            raise RuntimeError("LLM not provided for this stage")
        chunks = chunk_text(combined_text)
        results = []

        for i, chunk in enumerate(chunks):
            self.logger.info(f"[STAGE1] Chunk {i + 1}/{len(chunks)}")

            result = self.llm.structured_completion(
                prompt=prompts.s1_prompt(chunk), schema=Stage1Result, use_schema=True
            )
            results.append(result)

        seen = set()
        merged = []

        for r in results:
            for p in r.main_points:
                if p not in seen:
                    seen.add(p)
                    merged.append(p)

        return Stage1Result(main_points=merged)
