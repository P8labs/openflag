from core import prompts
from services.llm import LLMClient
from .types import Stage2Result
from pipeline.stages.base_stage import BaseStage


class Stage2(BaseStage[Stage2Result]):
    def __init__(self, run_id: str, llm: LLMClient):
        super().__init__(run_id, "STAGE2", Stage2Result, llm)

    def _run(self, main_points: list[str]) -> Stage2Result:
        if not self.llm:
            raise RuntimeError("LLM not provided for this stage")
        return self.llm.structured_completion(
            prompt=prompts.s2_prompt(main_points), schema=Stage2Result, use_schema=True
        )
