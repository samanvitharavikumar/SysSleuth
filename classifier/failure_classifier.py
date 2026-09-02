# ============================================================
# RESULT BUILDER
# ============================================================

def build_result(
    failure_type,
    service,
    root_cause,
    reason,
    confidence,
):
    return {
        "failure_type": failure_type,
        "service": service,
        "root_cause": root_cause,
        "reason": reason,
        "confidence": confidence,
    }


# ============================================================
# NORMALIZATION
# ============================================================

def normalize(value):

    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


# ============================================================
# TRACE FAILURE TYPE
# ============================================================

def get_trace_failure_type(trace):
    """
    Safely retrieve explicit failure type from a trace.
    """

    possible_keys = [
        "failure_type",
        "failure.type",
        "failureType",
        "type",
    ]

    for key in possible_keys:

        value = trace.get(key)

        if value:
            return normalize(value)

    tags = trace.get("tags", [])

    if isinstance(tags, list):

        for tag in tags:

            if not isinstance(tag, dict):
                continue

            key = normalize(
                tag.get("key")
            )

            value = normalize(
                tag.get("value")
            )

            if key in [
                "failure.type",
                "failure_type",
                "failuretype",
            ]:

                return value

    return ""


# ============================================================
# TRACE SERVICE
# ============================================================

def get_trace_service(trace):

    service = trace.get("service")

    if service:
        return str(service)

    process_service = trace.get(
        "process_service"
    )

    if process_service:
        return str(process_service)

    return "unknown"


# ============================================================
# TRACE TEXT
# ============================================================

def trace_text(trace):

    values = []

    for key, value in trace.items():

        if key in [
            "trace_id",
            "span_id",
            "start_time",
            "start_time_us",
            "duration",
            "duration_ms",
        ]:
            continue

        if isinstance(
            value,
            (str, int, float, bool),
        ):

            values.append(
                str(value)
            )

    tags = trace.get("tags", [])

    if isinstance(tags, list):

        for tag in tags:

            if isinstance(tag, dict):

                values.append(
                    str(
                        tag.get(
                            "key",
                            "",
                        )
                    )
                )

                values.append(
                    str(
                        tag.get(
                            "value",
                            "",
                        )
                    )
                )

    return " ".join(values).lower()


# ============================================================
# CLASSIFY ONE TRACE
# ============================================================

def classify_trace(trace):

    failure_type = get_trace_failure_type(
        trace
    )

    service = get_trace_service(
        trace
    )

    text = trace_text(
        trace
    )

    # --------------------------------------------------
    # EXPLICIT PAYMENT
    # --------------------------------------------------

    if failure_type in [
        "payment_failure",
        "payment",
        "payment_failed",
    ]:

        return build_result(
            "PAYMENT_FAILURE",
            (
                service
                if service != "unknown"
                else "payment-service"
            ),
            "Payment service failed",
            "Payment request was declined",
            0.98,
        )

    # --------------------------------------------------
    # EXPLICIT DATABASE
    # --------------------------------------------------

    if failure_type in [
        "database_failure",
        "database",
        "db_failure",
    ]:

        return build_result(
            "DATABASE_FAILURE",
            service,
            f"Database failure detected in {service}",
            "Database unavailable",
            0.98,
        )

    # --------------------------------------------------
    # EXPLICIT SERVICE CRASH
    # --------------------------------------------------

    if failure_type in [
        "service_crash",
        "crash",
        "service_crashed",
    ]:

        return build_result(
            "SERVICE_CRASH",
            service,
            f"{service} crashed",
            f"{service} crashed",
            0.98,
        )

    # --------------------------------------------------
    # EXPLICIT TIMEOUT
    # --------------------------------------------------

    if failure_type in [
        "timeout",
        "timed_out",
        "latency",
    ]:

        return build_result(
            "TIMEOUT",
            service,
            f"{service} timed out",
            f"{service} timed out",
            0.98,
        )

    # --------------------------------------------------
    # EXPLICIT CASCADE
    # --------------------------------------------------

    if failure_type in [
        "cascading_failure",
        "cascade",
        "cascading",
    ]:

        return build_result(
            "CASCADING_FAILURE",
            service,
            "Failure propagated across services",
            "A downstream failure caused dependent services to fail",
            0.98,
        )

    # --------------------------------------------------
    # EXPLICIT STOCK FAILURE
    # --------------------------------------------------

    if failure_type in [
        "insufficient_stock",
        "out_of_stock",
        "stock_failure",
    ]:

        return build_result(
            "INSUFFICIENT_STOCK",
            (
                service
                if service != "unknown"
                else "inventory-service"
            ),
            "Insufficient inventory",
            "Requested quantity exceeds available stock",
            0.98,
        )

    # --------------------------------------------------
    # PAYMENT EVIDENCE
    # --------------------------------------------------

    if (
        "payment_declined" in text
        or "payment-service" in text
        or "payment service" in text
        or "payment failed" in text
        or "payment failure" in text
        or "status_code=402" in text
        or '"status_code": 402' in text
    ):

        return build_result(
            "PAYMENT_FAILURE",
            "payment-service",
            "Payment service failed",
            "Payment request was declined",
            0.98,
        )

    # --------------------------------------------------
    # DATABASE EVIDENCE
    # --------------------------------------------------

    if (
        "database_failure_test" in text
        or "database failure" in text
        or "database unavailable" in text
        or "postgres" in text
        or "sqlalchemy" in text
        or "database error" in text
    ):

        return build_result(
            "DATABASE_FAILURE",
            service,
            f"Database failure detected in {service}",
            "Database unavailable",
            0.97,
        )

    # --------------------------------------------------
    # SERVICE CRASH EVIDENCE
    # --------------------------------------------------

    if (
        "inventory_service_crash_test" in text
        or "service crash" in text
        or "service crashed" in text
        or "process crashed" in text
    ):

        return build_result(
            "SERVICE_CRASH",
            service,
            f"{service} crashed",
            f"{service} crashed",
            0.98,
        )

    # --------------------------------------------------
    # TIMEOUT EVIDENCE
    # --------------------------------------------------

    if (
        "inventory_service_timeout" in text
        or "timeout" in text
        or "timed out" in text
        or "deadline exceeded" in text
    ):

        return build_result(
            "TIMEOUT",
            service,
            f"{service} timed out",
            f"{service} timed out",
            0.98,
        )

    # --------------------------------------------------
    # STOCK EVIDENCE
    # --------------------------------------------------

    if (
        "insufficient_stock" in text
        or "insufficient inventory" in text
        or "out of stock" in text
        or "stock unavailable" in text
    ):

        return build_result(
            "INSUFFICIENT_STOCK",
            "inventory-service",
            "Insufficient inventory",
            "Requested quantity exceeds available stock",
            0.98,
        )

    # --------------------------------------------------
    # CASCADING FAILURE
    # --------------------------------------------------

    if (
        "cascading_failure" in text
        or "cascading failure" in text
        or "cascade" in text
    ):

        return build_result(
            "CASCADING_FAILURE",
            service,
            "Failure propagated across services",
            "A downstream failure caused dependent services to fail",
            0.97,
        )

    # --------------------------------------------------
    # GENERIC 5XX
    # --------------------------------------------------

    status_code = trace.get(
        "status_code"
    )

    try:
        status_code = int(
            status_code
        )

    except (TypeError, ValueError):
        status_code = None

    if (
        status_code is not None
        and status_code >= 500
    ):

        return build_result(
            "SERVICE_FAILURE",
            service,
            f"Failure detected in {service}",
            "Service returned an error",
            0.90,
        )

    return None


# ============================================================
# CLASSIFY FAILURE
# ============================================================

def classify_failure(
    logs,
    traces=None,
):

    if traces is None:
        traces = []

    if logs is None:
        logs = []

    # ========================================================
    # 1. CURRENT LOG MARKERS
    # ========================================================
    #
    # IMPORTANT:
    # Only explicit test markers are considered here.
    #
    # We deliberately DO NOT search for generic words such as
    # "timeout" in Docker logs because those can belong to an
    # older test.
    #
    # ========================================================

    for log in reversed(logs):

        text = str(log).lower()

        # --------------------------------------------------
        # PAYMENT
        # --------------------------------------------------

        if (
            "payment_declined" in text
            or "payment_failure" in text
        ):

            return build_result(
                "PAYMENT_FAILURE",
                "payment-service",
                "Payment service failed",
                "Payment request was declined",
                0.98,
            )

        # --------------------------------------------------
        # DATABASE
        # --------------------------------------------------

        if (
            "database_failure_test" in text
            or "database_failure" in text
        ):

            return build_result(
                "DATABASE_FAILURE",
                "inventory-service",
                "Database failure detected in inventory-service",
                "Database unavailable",
                0.98,
            )

        # --------------------------------------------------
        # CASCADING
        # --------------------------------------------------

        if (
            "cascading_failure" in text
            or "cascading failure" in text
        ):

            return build_result(
                "CASCADING_FAILURE",
                "inventory-service",
                "Failure propagated across services",
                "A downstream failure caused dependent services to fail",
                0.98,
            )

        # --------------------------------------------------
        # SERVICE CRASH
        # --------------------------------------------------

        if (
            "inventory_service_crash_test" in text
            or "service_crash" in text
        ):

            return build_result(
                "SERVICE_CRASH",
                "inventory-service",
                "Inventory service crashed",
                "Inventory service crashed",
                0.98,
            )

        # --------------------------------------------------
        # TIMEOUT
        # --------------------------------------------------

        if (
            "inventory_service_timeout" in text
            or "service_timeout" in text
        ):

            return build_result(
                "TIMEOUT",
                "inventory-service",
                "Inventory service timed out",
                "Inventory service timed out",
                0.98,
            )

        # --------------------------------------------------
        # STOCK
        # --------------------------------------------------

        if (
            "insufficient_stock" in text
            or "out_of_stock" in text
        ):

            return build_result(
                "INSUFFICIENT_STOCK",
                "inventory-service",
                "Insufficient inventory",
                "Requested quantity exceeds available stock",
                0.98,
            )

    # ========================================================
    # 2. TRACE EVIDENCE
    # ========================================================

    if traces:

        # --------------------------------------------------
        # EXPLICIT TRACE TYPES
        # --------------------------------------------------

        for trace in traces:

            failure_type = get_trace_failure_type(
                trace
            )

            if failure_type in [
                "payment_failure",
                "database_failure",
                "service_crash",
                "timeout",
                "cascading_failure",
                "insufficient_stock",
            ]:

                result = classify_trace(
                    trace
                )

                if result is not None:
                    return result

        # --------------------------------------------------
        # OTHER TRACE EVIDENCE
        # --------------------------------------------------

        for trace in traces:

            result = classify_trace(
                trace
            )

            if result is not None:
                return result

    # ========================================================
    # 3. UNKNOWN
    # ========================================================

    return build_result(
        "UNKNOWN",
        "unknown",
        "No matching failure pattern found",
        "No matching failure pattern found",
        0.30,
    )