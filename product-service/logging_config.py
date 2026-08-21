import logging
from pythonjsonlogger import jsonlogger


def setup_logging(service_name):
    logger = logging.getLogger(service_name)

    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()

        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s"
        )

        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger