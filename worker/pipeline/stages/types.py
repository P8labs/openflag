from typing import List
from pydantic import BaseModel


class Stage1Result(BaseModel):
    main_points: List[str]


class Stage2Result(BaseModel):
    quick_take: str
    what_matters: List[str]
    flags: List[str]
    verdict: str
    data_flow: List[str]
    feature_policies: List[str]


class Stage3Result(BaseModel):
    red_flags: List[str]
    yellow_flags: List[str]
    green_flags: List[str]

    best_practices: List[str]
    bad_practices: List[str]

    risk_score: int


class Flags(BaseModel):
    red: List[str]
    yellow: List[str]
    green: List[str]


class FinalResult(BaseModel):
    quick_take: str
    verdict: str

    flags: Flags
    risk_score: int

    what_matters: List[str]
    data_flow: List[str]
    feature_policies: List[str]

    best_practices: List[str]
    bad_practices: List[str]

    raw_points: List[str]
