from typing import Optional, Type, TypeVar, Generic
from pydantic import BaseModel

from utils.cache import load_cache, save_cache
from utils.logger import get_logger
from services.llm import LLMClient

T = TypeVar("T", bound=BaseModel)


class BaseStage(Generic[T]):
    def __init__(
        self,
        run_id: str,
        stage_name: str,
        schema: Type[T],
        llm: Optional[LLMClient] = None,
    ):
        self.run_id = run_id
        self.stage_name = stage_name
        self.schema = schema
        self.logger = get_logger()
        self.llm = llm

        self.path = f"data/runs/{run_id}/{stage_name}/result.json"

    def execute(self, input_data, force: bool = False) -> T:
        self.logger.info(f"[{self.stage_name.upper()}] Start")

        if not force:
            cached = load_cache(input_data, self.path, self.schema, self.logger)
            if cached:
                return cached

        result = self._run(input_data)

        save_cache(self.path, input_data, result)

        self.logger.info(f"[{self.stage_name.upper()}] Done")

        return result

    def _run(self, input_data) -> T:
        raise NotImplementedError("Stage must implement _run()")
