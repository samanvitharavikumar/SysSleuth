from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import requests

from telemetry_collector import (
    JAEGER_URL,
    extract_failure_traces,
    extract_failure_traces_for_product,
)

from failure_classifier import classify_failure


app = FastAPI(title="SysSleuth RCA Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#=====================================
# GET RECENT LOGS
# ============================================================




def get_recent_logs(service_name, lines=1000):
    try:
        result = subprocess.run(
            ["docker", "logs", "--tail", str(lines), service_name],
            capture_output=True,
            text=True,
            timeout=15,
        )

        output = (result.stdout or "") + "\n" + (result.stderr or "")
        if result.returncode != 0:
            print(f"Docker log error for {service_name}: {output}")
            return []

        raw_logs = [line.strip() for line in output.splitlines() if line.strip()]
        logs = [line for line in raw_logs if "GET /metrics" not in line]

        print(f"[LOG DEBUG] {service_name}: raw={len(raw_logs)}, filtered={len(logs)}")

        return logs if logs else raw_logs

    except Exception as e:
        print(f"Docker log collection error: {e}")
        return []


# ============================================================
# DEPENDENCY CHAIN
# ============================================================

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


# ============================================================
# ROOT CAUSE ANALYSIS
# ============================================================

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

    # ========================================================
    # SELECT BEST TRACE
    # ========================================================

    trace = None

    if traces:

        # ----------------------------------------------------
        # 1. EXACT FAILURE TYPE
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # 2. SERVICE MATCH
        # ----------------------------------------------------

        if trace is None:

            for item in traces:

                if (
                    item.get("service")
                    == service
                ):

                    trace = item

                    break

        # ----------------------------------------------------
        # 3. FIRST TRACE
        # ----------------------------------------------------

        if trace is None:

            trace = traces[0]

    # ========================================================
    # EVIDENCE
    # ========================================================

    evidence = {
        "logs_checked": len(logs),
        "failure_traces": len(traces),
    }

    # ========================================================
    # TRACE RESPONSE
    # ========================================================

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

    # ========================================================
    # DEPENDENCY CHAIN
    # ========================================================

    dependency_chain = get_dependency_chain(
        traces,
        service,
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

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



def check_jaeger():
    """
    Fail loudly if Jaeger cannot be reached. Without this, an unreachable
    Jaeger silently produces zero traces and the RCA falls through to
    UNKNOWN, which hides the real problem.
    """
    try:
        requests.get(
            f"{JAEGER_URL}/api/services",
            timeout=5,
        ).raise_for_status()
    except requests.RequestException as e:
        print(f"Jaeger unreachable at {JAEGER_URL}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Jaeger is unreachable at {JAEGER_URL}",
        )


@app.get("/analyze/{service_name}")
def analyze(
    service_name: str,
    product_id: int | None = None,
):
    print(f"\nAnalyzing service: {service_name}")

    check_jaeger()

    # ========================================================
    # PRODUCT-SPECIFIC RCA
    # ========================================================

    if product_id is not None:
        print(f"Product-specific RCA requested: {product_id}")

        traces = extract_failure_traces_for_product(
            product_id,
            100,
        )

        print(f"Matching product failure traces: {len(traces)}")

        # Use the service identified by the failure trace.
        if traces:
            actual_service = traces[0].get("service")
            if actual_service:
                service_name = actual_service

        logs = get_recent_logs(service_name, 1000)

    else:
        # Normal RCA when no product ID is provided.
        logs = get_recent_logs(service_name, 1000)

        traces = extract_failure_traces(
            service_name,
            100,
        )

        # Switch to the actual failing service if identified.
        if traces:
            actual_service = traces[0].get("service")
            if actual_service:
                service_name = actual_service
                logs = get_recent_logs(service_name, 1000)

    print(f"Collected logs: {len(logs)}")
    print(f"Collected failure traces: {len(traces)}")

    # ========================================================
    # CLASSIFICATION
    # ========================================================

    classification = classify_failure(
        logs,
        traces,
    )

    print("Classification:", classification)

    # ========================================================
    # RCA
    # ========================================================

    result = analyze_failure(
        classification,
        logs,
        traces,
    )

    return result