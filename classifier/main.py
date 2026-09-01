from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .failure_classifier import classify_failure
from .log_collector import get_recent_logs
from .telemetry_collector import extract_failure_traces


app = FastAPI(
    title="SysSleuth RCA Service"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():

    return {
        "service": "syssleuth-rca",
        "status": "healthy"
    }


@app.get("/analyze/{service_name}")
def analyze_service(service_name: str):

    # -----------------------------------
    # COLLECT LOGS
    # -----------------------------------

    logs = get_recent_logs(
        service_name,
        lines=500
    )

    # -----------------------------------
    # COLLECT JAEGER FAILURE TRACES
    # -----------------------------------

    traces = extract_failure_traces(
        service_name,
        limit=100
    )

    # -----------------------------------
    # CLASSIFY
    # -----------------------------------

    classification = classify_failure(
        logs,
        traces
    )

    # -----------------------------------
    # RETURN COMPLETE RCA
    # -----------------------------------

    return {

        "service": classification["service"],

        "failure_type":
            classification["failure_type"],

        "root_cause":
            classification["root_cause"],

        "reason":
            classification["reason"],

        "confidence":
            classification["confidence"],

        "evidence": {
            "logs_checked": len(logs),
            "failure_traces": len(traces)
        },

        "logs": logs,

        "traces": traces,

        "dependency_chain": [
            "frontend",
            "api-gateway",
            service_name
        ]
    }