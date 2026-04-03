from pydantic import BaseModel
from typing import Dict


class SoftwareInput(BaseModel):
    name: str
    urls: Dict[str, str]


class FetchedItem(BaseModel):
    type: str
    url: str
    html: str
    status_code: int | None = None
    from_cache: bool = False


class CleanedItem(BaseModel):
    type: str
    url: str
    text: str
