from core import prompts
from services.llm import LLMClient
from .types import Stage3Result
from pipeline.stages.base_stage import BaseStage


class Stage3(BaseStage[Stage3Result]):
    def __init__(self, run_id: str, llm: LLMClient):
        super().__init__(run_id, "STAGE3", Stage3Result, llm)

    def _run(self, stage2: dict) -> Stage3Result:
        if not self.llm:
            raise RuntimeError("LLM not provided for this stage")
        return self.llm.structured_completion(
            prompt=prompts.s3_prompt(stage2), schema=Stage3Result, use_schema=True
        )
