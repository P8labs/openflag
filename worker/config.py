import os
from dataclasses import dataclass
from dotenv import load_dotenv


load_dotenv()


def _get_bool(key: str, default: bool = False) -> bool:
    value = os.getenv(key)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Missing required env: {key}")
    return value


@dataclass(frozen=True)
class Config:
    DATABASE_URL: str
    OPENAI_API_KEY: str | None
    MODEL: str
    SUPPORT_JSON: bool

    BASE_PATH: str


def load_config() -> Config:
    return Config(
        DATABASE_URL=_require("DATABASE_URL"),
        OPENAI_API_KEY=os.getenv("OPENAI_API_KEY"),
        MODEL=os.getenv("MODEL", "qwen/qwen3.6-plus:free"),
        SUPPORT_JSON=_get_bool("SUPPORT_JSON", False),
        BASE_PATH=os.getenv("BASE_PATH", "data/runs"),
    )


config = load_config()
