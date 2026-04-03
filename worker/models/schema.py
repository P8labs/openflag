from pydantic import BaseModel
from typing import List


class ExtractionResult(BaseModel):
    data_collected: List[str]
    tracking: List[str]
    third_party_sharing: str
    data_retention: str
    user_rights: List[str]
