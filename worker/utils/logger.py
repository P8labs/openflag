import logging
import os
from contextvars import ContextVar

_logger_ctx: ContextVar[logging.Logger] = ContextVar("logger", default=None)  # type: ignore


def init_logger(run_id: str) -> logging.Logger:
    logger = logging.getLogger(f"run:{run_id}")

    if logger.handlers:
        _logger_ctx.set(logger)
        return logger

    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        f"[%(asctime)s] [{run_id}] [%(levelname)s] %(message)s"
    )

    ch = logging.StreamHandler()
    ch.setFormatter(formatter)

    path = f"data/runs/{run_id}/logs.txt"
    os.makedirs(os.path.dirname(path), exist_ok=True)

    fh = logging.FileHandler(path)
    fh.setFormatter(formatter)

    logger.addHandler(ch)
    logger.addHandler(fh)

    _logger_ctx.set(logger)

    return logger


def get_logger() -> logging.Logger:
    logger = _logger_ctx.get()

    if logger is None:
        raise RuntimeError("Logger not initialized in this context")

    return logger


def log():
    return get_logger()
