from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import json

from .telemetry_collector import (
    extract_failure_traces,
)

from .failure_classifier import (
    classify_failure,
)


app = FastAPI(
    title="SysSleuth RCA Classifier"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# GET RECENT LOGS
# --------------------------------------------------

def get_recent_logs(
    service_name,
    lines=200,
):
    """
    Read recent Docker logs for the service.
    """

    try:

        result = subprocess.run(
            [
                "docker",
                "compose",
                "logs",
                "--tail",
                str(lines),
                service_name,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        output = result.stdout

        if result.stderr:
            output += "\n" + result.stderr

        logs = []

        for line in output.splitlines():

            line = line.strip()

            if not line:
                continue

            logs.append(line)

        return logs

    except Exception as e:

        print(
            "Docker log error:",
            e,
        )

        return []


# --------------------------------------------------
# DEPENDENCY CHAIN
# --------------------------------------------------

def get_dependency_chain(
    traces,
    service_name,
):
    """
    Build a simple service dependency chain
    from the collected traces.
    """

    services = []

    for trace in traces:

        service = trace.get(
            "service"
        )

        if (
            service
            and service not in services
        ):

            services.append(
                service
            )

    if service_name not in services:
        services.append(
            service_name
        )

    return services


# --------------------------------------------------
# ROOT CAUSE ANALYSIS
# --------------------------------------------------

def analyze_failure(
    classification,
    logs,
    traces,
):
    """
    Build the final RCA response.
    """

    failure_type = classification.get(
        "failure_type",
        "UNKNOWN",
    )

    root_cause = classification.get(
        "root_cause",
        "Unable to determine root cause",
    )

    reason = classification.get(
        "reason",
        "Insufficient telemetry evidence.",
    )

    confidence = classification.get(
        "confidence",
        0.50,
    )

    service = classification.get(
        "service",
        "inventory-service",
    )

    # --------------------------------------------------
    # SELECT BEST TRACE
    # --------------------------------------------------

    trace = None

    if traces:

        # First try exact failure type
        for item in traces:

            item_type = str(
                item.get(
                    "failure_type",
                    "",
                )
            ).lower()

            expected_type = str(
                failure_type
            ).lower()

            if item_type == expected_type:

                trace = item
                break

        # Otherwise choose service trace
        if trace is None:

            for item in traces:

                if (
                    item.get("service")
                    == service
                ):

                    trace = item
                    break

        # Otherwise first trace
        if trace is None:

            trace = traces[0]

    # --------------------------------------------------
    # EVIDENCE
    # --------------------------------------------------

    evidence = {
        "logs_checked": len(logs),
        "failure_traces": len(traces),
    }

    # --------------------------------------------------
    # TRACE RESPONSE
    # --------------------------------------------------

    trace_response = []

    for item in traces:

        trace_response.append(
            {
                "trace_id": item.get(
                    "trace_id"
                ),
                "span_id": item.get(
                    "span_id"
                ),
                "operation": item.get(
                    "operation"
                ),
                "failure_type": item.get(
                    "failure_type"
                ),
                "http_method": item.get(
                    "http_method"
                ),
                "product_id": item.get(
                    "product_id"
                ),
                "quantity": item.get(
                    "quantity"
                ),
                "status_code": item.get(
                    "status_code"
                ),
                "service": item.get(
                    "service"
                ),
                "start_time": item.get(
                    "start_time"
                ),
                "end_time": item.get(
                    "end_time"
                ),
                "duration_ms": item.get(
                    "duration_ms"
                ),
            }
        )

    # --------------------------------------------------
    # DEPENDENCY CHAIN
    # --------------------------------------------------

    dependency_chain = get_dependency_chain(
        traces,
        service,
    )

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------

    response = {
        "service": service,
        "failure_type": failure_type,
        "root_cause": root_cause,
        "reason": reason,
        "confidence": confidence,
        "evidence": evidence,
        "logs": logs,
        "traces": trace_response,
        "dependency_chain": dependency_chain,
    }

    return response


# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "service": "SysSleuth RCA Classifier",
        "status": "running",
    }


# --------------------------------------------------
# ANALYZE
# --------------------------------------------------

@app.get(
    "/analyze/{service_name}"
)
def analyze(
    service_name: str,
):

    print(
        f"\nAnalyzing service: {service_name}"
    )

    # --------------------------------------------------
    # LOGS
    # --------------------------------------------------

    logs = get_recent_logs(
        service_name,
        200,
    )

    print(
        f"Collected logs: {len(logs)}"
    )

    # --------------------------------------------------
    # TRACES
    # --------------------------------------------------

    traces = extract_failure_traces(
        service_name,
        100,
    )

    print(
        f"Collected failure traces: {len(traces)}"
    )

    # --------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------

    classification = classify_failure(
        logs,
        traces,
    )

    print(
        "Classification:",
        classification,
    )

    # --------------------------------------------------
    # RCA
    # --------------------------------------------------

    result = analyze_failure(
        classification,
        logs,
        traces,
    )

    return result