from .types import FinalResult, Flags
from pipeline.stages.base_stage import BaseStage


class Stage4(BaseStage[FinalResult]):
    def __init__(self, run_id: str):
        super().__init__(run_id, "STAGE4", FinalResult)

    def _run(
        self,
        input: dict,
    ) -> FinalResult:

        stage1: list[str] = input["stage1"]
        stage2: dict = input["stage2"]
        stage3: dict = input["stage3"]
        final = FinalResult(
            quick_take=stage2["quick_take"],
            verdict=stage2["verdict"],
            flags=Flags(
                red=stage3["red_flags"],
                yellow=stage3["yellow_flags"],
                green=stage3["green_flags"],
            ),
            risk_score=stage3["risk_score"],
            what_matters=stage2["what_matters"],
            data_flow=stage2["data_flow"],
            feature_policies=stage2["feature_policies"],
            best_practices=stage3["best_practices"],
            bad_practices=stage3["bad_practices"],
            raw_points=stage1,
        )
        return final
