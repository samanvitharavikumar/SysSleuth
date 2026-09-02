# classifier/rca_analyzer.py


def normalize_failure_type(value):
    """
    Normalize failure type names.
    """

    if value is None:
        return None

    value = str(value).strip().lower()

    mapping = {
        "database_failure": "DATABASE_FAILURE",
        "db_failure": "DATABASE_FAILURE",
        "database": "DATABASE_FAILURE",

        "service_crash": "SERVICE_CRASH",
        "service crash": "SERVICE_CRASH",
        "crash": "SERVICE_CRASH",

        "timeout": "TIMEOUT",
        "service_timeout": "TIMEOUT",
        "service timeout": "TIMEOUT",

        "payment_failure": "PAYMENT_FAILURE",
        "payment failure": "PAYMENT_FAILURE",
        "payment_failed": "PAYMENT_FAILURE",
        "payment failed": "PAYMENT_FAILURE",

        "cascading_failure": "CASCADING_FAILURE",
        "cascading failure": "CASCADING_FAILURE",
        "cascade_failure": "CASCADING_FAILURE",

        "insufficient_stock": "INSUFFICIENT_STOCK",
        "insufficient stock": "INSUFFICIENT_STOCK",

        "service_failure": "SERVICE_FAILURE",
        "service failure": "SERVICE_FAILURE",
    }

    return mapping.get(value)


def get_trace_failure_type(trace):
    """
    Determine the failure type from one trace.
    """

    explicit = normalize_failure_type(
        trace.get("failure_type")
    )

    if explicit:
        return explicit

    service = str(
        trace.get("service", "")
    ).lower()

    status_code = trace.get(
        "status_code"
    )

    operation = str(
        trace.get("operation", "")
    ).lower()

    # Payment service + 402
    if (
        service == "payment-service"
        and status_code == 402
    ):

        return "PAYMENT_FAILURE"

    # Payment operation
    if (
        "payment" in service
        or "payment" in operation
    ):

        if status_code == 402:

            return "PAYMENT_FAILURE"

    return None


def find_best_failure_trace(traces):
    """
    Select the most meaningful failure trace.
    """

    if not traces:

        return None

    # --------------------------------------------------
    # 1. Explicit database failure
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "DATABASE_FAILURE":

            return trace

    # --------------------------------------------------
    # 2. Explicit payment failure
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "PAYMENT_FAILURE":

            return trace

    # --------------------------------------------------
    # 3. Explicit cascading failure
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "CASCADING_FAILURE":

            return trace

    # --------------------------------------------------
    # 4. Explicit service crash
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "SERVICE_CRASH":

            return trace

    # --------------------------------------------------
    # 5. Explicit timeout
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "TIMEOUT":

            return trace

    # --------------------------------------------------
    # 6. Insufficient stock
    # --------------------------------------------------

    for trace in traces:

        failure_type = get_trace_failure_type(
            trace
        )

        if failure_type == "INSUFFICIENT_STOCK":

            return trace

    # --------------------------------------------------
    # 7. Any explicit failure
    # --------------------------------------------------

    for trace in traces:

        if trace.get("failure_type"):

            return trace

    # --------------------------------------------------
    # 8. Fallback
    # --------------------------------------------------

    return traces[0]


def analyze_failure(
    classification,
    logs,
    traces
):
    """
    Convert failure classification + logs + traces
    into a SysSleuth root-cause analysis result.

    Trace evidence has priority over generic
    classification when an explicit failure type
    is available.
    """

    classification = (
        classification
        if isinstance(classification, dict)
        else {}
    )

    logs = (
        logs
        if isinstance(logs, list)
        else []
    )

    traces = (
        traces
        if isinstance(traces, list)
        else []
    )

    # --------------------------------------------------
    # INITIAL CLASSIFICATION
    # --------------------------------------------------

    failure_type = normalize_failure_type(
        classification.get(
            "failure_type"
        )
    )

    service = classification.get(
        "service",
        "unknown"
    )

    reason = classification.get(
        "reason",
        "Unknown failure"
    )

    # --------------------------------------------------
    # FIND BEST TRACE
    # --------------------------------------------------

    failure_trace = find_best_failure_trace(
        traces
    )

    # --------------------------------------------------
    # TRACE-BASED CLASSIFICATION
    # --------------------------------------------------

    if failure_trace:

        trace_failure_type = (
            get_trace_failure_type(
                failure_trace
            )
        )

        if trace_failure_type:

            failure_type = trace_failure_type

            trace_service = (
                failure_trace.get(
                    "service"
                )
            )

            if trace_service:

                service = trace_service

    # --------------------------------------------------
    # DATABASE FAILURE
    # --------------------------------------------------

    if failure_type == "DATABASE_FAILURE":

        result = {

            "failure_type":
                "DATABASE_FAILURE",

            "service":
                service,

            "root_cause":
                "Database failure detected in inventory-service",

            "reason":
                reason,

            "confidence":
                0.98,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # SERVICE CRASH
    # --------------------------------------------------

    elif failure_type == "SERVICE_CRASH":

        result = {

            "failure_type":
                "SERVICE_CRASH",

            "service":
                service,

            "root_cause":
                "Inventory service crashed during the request",

            "reason":
                reason,

            "confidence":
                0.98,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # TIMEOUT
    # --------------------------------------------------

    elif failure_type == "TIMEOUT":

        result = {

            "failure_type":
                "TIMEOUT",

            "service":
                service,

            "root_cause":
                "Inventory service experienced excessive latency and timed out",

            "reason":
                reason,

            "confidence":
                0.98,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # PAYMENT FAILURE
    # --------------------------------------------------

    elif failure_type == "PAYMENT_FAILURE":

        result = {

            "failure_type":
                "PAYMENT_FAILURE",

            "service":
                "payment-service",

            "root_cause":
                "Payment service rejected or failed the payment request",

            "reason":
                reason,

            "confidence":
                0.98,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # CASCADING FAILURE
    # --------------------------------------------------

    elif failure_type == "CASCADING_FAILURE":

        result = {

            "failure_type":
                "CASCADING_FAILURE",

            "service":
                service,

            "root_cause":
                "Failure propagated from a dependent service",

            "reason":
                reason,

            "confidence":
                0.95,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # INSUFFICIENT STOCK
    # --------------------------------------------------

    elif failure_type == "INSUFFICIENT_STOCK":

        result = {

            "failure_type":
                "INSUFFICIENT_STOCK",

            "service":
                "inventory-service",

            "root_cause":
                "Requested quantity exceeded available inventory",

            "reason":
                reason,

            "confidence":
                0.99,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # SERVICE FAILURE
    # --------------------------------------------------

    elif failure_type == "SERVICE_FAILURE":

        result = {

            "failure_type":
                "SERVICE_FAILURE",

            "service":
                service,

            "root_cause":
                "A service failed while processing the request",

            "reason":
                reason,

            "confidence":
                0.90,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # UNKNOWN
    # --------------------------------------------------

    else:

        result = {

            "failure_type":
                "UNKNOWN",

            "service":
                service,

            "root_cause":
                "Unable to determine the root cause",

            "reason":
                reason,

            "confidence":
                0.0,

            "evidence": {

                "logs_checked":
                    len(logs),

                "failure_traces":
                    len(traces),
            },
        }

    # --------------------------------------------------
    # ADD TRACE INFORMATION
    # --------------------------------------------------

    if failure_trace:

        result["trace"] = {

            "trace_id":
                failure_trace.get(
                    "trace_id"
                ),

            "span_id":
                failure_trace.get(
                    "span_id"
                ),

            "operation":
                failure_trace.get(
                    "operation"
                ),

            "status_code":
                failure_trace.get(
                    "status_code"
                ),

            "product_id":
                failure_trace.get(
                    "product_id"
                ),

            "quantity":
                failure_trace.get(
                    "quantity"
                ),

            "service":
                failure_trace.get(
                    "service"
                ),

            "failure_type":
                failure_trace.get(
                    "failure_type"
                ),

            "http_method":
                failure_trace.get(
                    "http_method"
                ),

            "start_time":
                failure_trace.get(
                    "start_time"
                ),

            "end_time":
                failure_trace.get(
                    "end_time"
                ),

            "duration_ms":
                failure_trace.get(
                    "duration_ms"
                ),
        }

    return result