from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any


class Tables:
    SOFTWARE = "softwares"
    RUN = "runs"
    ANALYSIS = "analysis"


class RunCols:
    ID = "id"
    SOFTWARE_ID = "software_id"
    STATUS = "status"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    STARTED_AT = "started_at"
    FINISHED_AT = "finished_at"

    STAGE_1 = "stage_1"
    STAGE_2 = "stage_2"
    STAGE_3 = "stage_3"
    FINAL = "final"

    LOGS = "logs"
    ERROR = "error"


class SoftwareCols:
    ID = "id"
    NAME = "name"
    TYPE = "type"
    SLUG = "slug"
    LOCATION = "location"
    DESCRIPTION = "description"
    LOGO_URL = "logo_url"
    URLS = "urls"
    STATUS = "status"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"


class AnalysisCols:
    SOFTWARE_ID = "software_id"
    QUICK_TAKE = "quick_take"
    VERDICT = "verdict"
    RISK_SCORE = "risk_score"

    RED_FLAGS = "red_flags"
    YELLOW_FLAGS = "yellow_flags"
    GREEN_FLAGS = "green_flags"

    WHAT_MATTERS = "what_matters"
    DATA_FLOW = "data_flow"
    FEATURE_POLICIES = "feature_policies"

    BEST_PRACTICES = "best_practices"
    BAD_PRACTICES = "bad_practices"

    REVIEWED = "reviewed"
    GENERATED_AT = "generated_at"
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"


class SoftwareStatus:
    PRE_REVIEWED = "PRE_REVIEWED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"


class SoftwareType:
    WEB = "WEB"
    MOBILE = "MOBILE"
    CLI = "CLI"
    OS = "OS"
    UTIL = "UTIL"


class RunStatus:
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DONE = "DONE"
    FAILED = "FAILED"


class Verdict:
    SAFE = "SAFE"
    CAUTION = "CAUTION"
    HIGH_RISK = "HIGH_RISK"


@dataclass
class SoftwareRow:
    id: str
    name: str
    type: str
    slug: str
    location: str

    description: Optional[str]
    logo_url: Optional[str]

    urls: Dict[str, Any]

    status: str

    created_at: datetime
    updated_at: datetime


@dataclass
class RunRow:
    id: str
    software_id: str
    status: str

    created_at: datetime
    updated_at: datetime

    started_at: Optional[datetime]
    finished_at: Optional[datetime]

    stage_1: Optional[Dict[str, Any]] = None
    stage_2: Optional[Dict[str, Any]] = None
    stage_3: Optional[Dict[str, Any]] = None
    final: Optional[Dict[str, Any]] = None

    logs: Optional[str] = None
    error: Optional[str] = None


@dataclass
class AnalysisRow:
    id: str
    software_id: str

    quick_take: str
    verdict: str
    risk_score: int

    red_flags: List[str]
    yellow_flags: List[str]
    green_flags: List[str]

    what_matters: List[str]
    data_flow: List[str]
    feature_policies: List[str]

    best_practices: List[str]
    bad_practices: List[str]

    reviewed: bool
    version: Optional[str]

    generated_at: datetime
    created_at: datetime
    updated_at: datetime
