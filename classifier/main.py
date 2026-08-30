from fastapi import FastAPI
from pydantic import BaseModel

from failure_classifier import classify_failure
from log_collector import get_recent_logs


app = FastAPI(title="Failure Classification Service")


class ClassificationRequest(BaseModel):
    logs: list[str]


@app.get("/health")
def health():
    return {
        "service": "failure-classifier",
        "status": "healthy"
    }


# -----------------------------------
# CLASSIFY PROVIDED LOGS
# -----------------------------------

@app.post("/classify")
def classify(request: ClassificationRequest):

    result = classify_failure(request.logs)

    return result


# -----------------------------------
# CLASSIFY ACTUAL SERVICE LOGS
# -----------------------------------

@app.get("/classify/{service_name}")
def classify_service(service_name: str):

    logs = get_recent_logs(service_name)

    result = classify_failure(logs)

    return {
        "service_checked": service_name,
        "logs_checked": len(logs),
        "classification": result
    }