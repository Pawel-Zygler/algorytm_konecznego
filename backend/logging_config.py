import logging
import sys
import copy
from uvicorn.config import LOGGING_CONFIG

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def get_uvicorn_log_config() -> dict:
    """Returns a copy of uvicorn's LOGGING_CONFIG augmented with timestamp formatters."""
    config = copy.deepcopy(LOGGING_CONFIG)
    config["formatters"]["default"] = {
        "()": "uvicorn.logging.DefaultFormatter",
        "fmt": "%(asctime)s %(levelprefix)s %(message)s",
        "datefmt": DATE_FORMAT,
        "use_colors": None,
    }
    config["formatters"]["access"] = {
        "()": "uvicorn.logging.AccessFormatter",
        "fmt": '%(asctime)s %(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
        "datefmt": DATE_FORMAT,
        "use_colors": None,
    }
    return config

def setup_logging(level=logging.INFO):
    """Configures root logger and any existing uvicorn loggers with timestamps."""
    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        force=True
    )
    
    # Update uvicorn loggers if uvicorn is loaded
    try:
        from uvicorn.logging import DefaultFormatter, AccessFormatter
        
        for name in ("uvicorn", "uvicorn.error"):
            u_logger = logging.getLogger(name)
            for handler in u_logger.handlers:
                handler.setFormatter(DefaultFormatter(
                    fmt="%(asctime)s %(levelprefix)s %(message)s",
                    datefmt=DATE_FORMAT,
                    use_colors=True
                ))
        
        u_access = logging.getLogger("uvicorn.access")
        for handler in u_access.handlers:
            handler.setFormatter(AccessFormatter(
                fmt='%(asctime)s %(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
                datefmt=DATE_FORMAT,
                use_colors=True
            ))
    except ImportError:
        pass
