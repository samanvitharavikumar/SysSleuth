import requests


JAEGER_URL = "http://jaeger:16686"
# ============================================================
# JAEGER
# ============================================================

def get_recent_traces(service_name, limit=100):
    """
    Fetch recent traces for a specific service from Jaeger.
    """

    try:
        response = requests.get(
            f"{JAEGER_URL}/api/traces",
            params={
                "service": service_name,
                "limit": limit,
            },
            timeout=5,
        )

        response.raise_for_status()

        data = response.json()

        return data.get("data", [])

    except Exception as e:
        print("Jaeger error:", e)
        return []


def get_recent_traces_all_services(limit=100):
    """
    Fetch recent traces from all SysSleuth services.

    This is required because a checkout can fail in a
    downstream service such as payment-service.
    """

    services = [
        "order-service",
        "inventory-service",
        "payment-service",
        "product-service",
    ]

    all_traces = []

    # Used to prevent duplicate distributed traces.
    seen_trace_ids = set()

    for service_name in services:

        traces = get_recent_traces(
            service_name,
            limit,
        )

        for trace in traces:

            trace_id = trace.get("traceID")

            if trace_id in seen_trace_ids:
                continue

            seen_trace_ids.add(trace_id)

            all_traces.append(trace)

    return all_traces


# ============================================================
# TAG HELPERS
# ============================================================

def get_tag(span, key):
    """
    Get a tag value from a Jaeger span.
    """

    for tag in span.get("tags", []):

        if tag.get("key") == key:
            return tag.get("value")

    return None


def get_first_tag(span, keys):
    """
    Return the first non-empty tag matching any supplied key.
    """

    for key in keys:

        value = get_tag(
            span,
            key,
        )

        if value is not None:
            return value

    return None


def get_process_service(trace, span):
    """
    Determine the service name for a span using Jaeger's
    process map.
    """

    process_id = span.get("processID")

    processes = trace.get(
        "processes",
        {},
    )

    if process_id and process_id in processes:

        service_name = processes[
            process_id
        ].get("serviceName")

        if service_name:
            return service_name

    return None


# ============================================================
# FAILURE TYPE NORMALIZATION
# ============================================================

def normalize_failure_type(value):
    """
    Normalize explicit failure.type values.
    """

    if value is None:
        return None

    value = str(value).strip().lower()

    mapping = {

        "database_failure": "database_failure",
        "db_failure": "database_failure",
        "database": "database_failure",

        "service_crash": "service_crash",
        "service crash": "service_crash",
        "crash": "service_crash",

        "timeout": "timeout",
        "service_timeout": "timeout",
        "service timeout": "timeout",

        "payment_failure": "payment_failure",
        "payment failure": "payment_failure",
        "payment_failed": "payment_failure",
        "payment failed": "payment_failure",

        "cascading_failure": "cascading_failure",
        "cascading failure": "cascading_failure",
        "cascade_failure": "cascading_failure",

        "insufficient_stock": "insufficient_stock",
        "insufficient stock": "insufficient_stock",

        "service_failure": "service_failure",
        "service failure": "service_failure",
    }

    return mapping.get(
        value,
        value,
    )


# ============================================================
# FAILURE TEXT
# ============================================================

def span_contains_failure_text(span):
    """
    Search span tags and span logs for failure-related text.
    """

    failure_words = [
        "error",
        "exception",
        "failed",
        "failure",
        "timeout",
        "timed out",
        "deadline exceeded",
        "service unavailable",
        "internal server error",
    ]

    # --------------------------------------------------------
    # TAGS
    # --------------------------------------------------------

    for tag in span.get("tags", []):

        key = str(
            tag.get(
                "key",
                "",
            )
        ).lower()

        value = str(
            tag.get(
                "value",
                "",
            )
        ).lower()

        combined = f"{key} {value}"

        if any(
            word in combined
            for word in failure_words
        ):
            return True

    # --------------------------------------------------------
    # SPAN LOGS
    # --------------------------------------------------------

    for log in span.get("logs", []):

        for field in log.get(
            "fields",
            [],
        ):

            key = str(
                field.get(
                    "key",
                    "",
                )
            ).lower()

            value = str(
                field.get(
                    "value",
                    "",
                )
            ).lower()

            combined = f"{key} {value}"

            if any(
                word in combined
                for word in failure_words
            ):
                return True

    return False


# ============================================================
# COMMON SPAN EXTRACTION
# ============================================================

def build_failure_trace(
    trace,
    span,
    explicit_failure_type,
    status_code_int,
    exception_type,
    exception_message,
    timeout_detected,
):
    """
    Convert a Jaeger span into the normalized RCA trace format.
    """

    trace_id = trace.get(
        "traceID"
    )

    span_id = span.get(
        "spanID"
    )

    operation = span.get(
        "operationName",
        "",
    )

    service = get_process_service(
        trace,
        span,
    )

    if not service:
        service = "unknown-service"

    # --------------------------------------------------------
    # FAILURE TYPE
    # --------------------------------------------------------

    if explicit_failure_type:

        failure_type = (
            explicit_failure_type
        )

    elif (
        service == "payment-service"
        and status_code_int == 402
    ):

        failure_type = (
            "payment_failure"
        )

    elif timeout_detected:

        failure_type = "timeout"

    elif (
        status_code_int is not None
        and status_code_int >= 500
    ):

        failure_type = "service_failure"

    elif exception_type:

        exception_lower = str(
            exception_type
        ).lower()

        if (
            "database" in exception_lower
            or "sql" in exception_lower
            or "postgres" in exception_lower
        ):

            failure_type = (
                "database_failure"
            )

        else:

            failure_type = (
                "service_failure"
            )

    else:

        failure_type = (
            "service_failure"
        )

    # --------------------------------------------------------
    # PRODUCT ID
    # --------------------------------------------------------

    product_id = get_first_tag(
        span,
        [
            "failure.product_id",
            "product_id",
            "product.id",
            "productId",
            "http.path.product_id",
        ],
    )

    # --------------------------------------------------------
    # QUANTITY
    # --------------------------------------------------------

    quantity = get_first_tag(
        span,
        [
            "failure.quantity",
            "quantity",
            "product.quantity",
            "product_quantity",
        ],
    )

    # --------------------------------------------------------
    # HTTP METHOD
    # --------------------------------------------------------

    http_method = get_first_tag(
        span,
        [
            "http.method",
            "http.request.method",
        ],
    )

    # --------------------------------------------------------
    # TIMING
    # --------------------------------------------------------

    start_time = span.get(
        "startTime"
    )

    duration = span.get(
        "duration"
    )

    duration_ms = None

    if duration is not None:

        try:

            duration_ms = round(
                int(duration) / 1000,
                2,
            )

        except (
            ValueError,
            TypeError,
        ):

            duration_ms = None

    # --------------------------------------------------------
    # END TIME
    # --------------------------------------------------------

    end_time = None

    if (
        start_time is not None
        and duration is not None
    ):

        try:

            end_time = (
                int(start_time)
                + int(duration)
            )

        except (
            ValueError,
            TypeError,
        ):

            end_time = None

    return {
        "trace_id": trace_id,
        "span_id": span_id,
        "operation": operation,
        "failure_type": failure_type,
        "http_method": http_method,
        "product_id": product_id,
        "quantity": quantity,
        "status_code": status_code_int,
        "service": service,
        "start_time": start_time,
        "end_time": end_time,
        "duration_ms": duration_ms,
    }


# ============================================================
# FAILURE TRACE EXTRACTION
# ============================================================

def extract_failure_traces(
    service_name,
    limit=100,
):
    """
    Extract failure-related spans from Jaeger.

    Explicit failure.type is the strongest signal.

    Generic latency alone is NOT enough to declare a timeout.
    """

    traces = get_recent_traces(
        service_name,
        limit,
    )

    failure_traces = []

    for trace in traces:

        spans = trace.get(
            "spans",
            [],
        )

        for span in spans:

            # ------------------------------------------------
            # SERVICE
            # ------------------------------------------------

            service = get_process_service(
                trace,
                span,
            )

            if not service:
                service = service_name

            # ------------------------------------------------
            # EXPLICIT FAILURE TYPE
            # ------------------------------------------------

            explicit_failure_type = get_first_tag(
                span,
                [
                    "failure.type",
                    "failure_type",
                    "failure.type.name",
                ],
            )

            explicit_failure_type = normalize_failure_type(
                explicit_failure_type
            )

            # ------------------------------------------------
            # STATUS CODE
            # ------------------------------------------------

            status_code = get_first_tag(
                span,
                [
                    "http.status_code",
                    "http.response.status_code",
                    "rpc.grpc.status_code",
                ],
            )

            try:

                status_code_int = (
                    int(status_code)
                    if status_code is not None
                    else None
                )

            except (
                ValueError,
                TypeError,
            ):

                status_code_int = None

            # ------------------------------------------------
            # ERROR
            # ------------------------------------------------

            error_tag = get_first_tag(
                span,
                [
                    "error",
                    "error.type",
                ],
            )

            # ------------------------------------------------
            # OTEL STATUS
            # ------------------------------------------------

            otel_status = get_first_tag(
                span,
                [
                    "otel.status_code",
                ],
            )

            # ------------------------------------------------
            # EXCEPTION
            # ------------------------------------------------

            exception_type = get_first_tag(
                span,
                [
                    "exception.type",
                ],
            )

            exception_message = get_first_tag(
                span,
                [
                    "exception.message",
                ],
            )

            # ------------------------------------------------
            # TIMEOUT
            # ------------------------------------------------

            operation_lower = str(
                span.get(
                    "operationName",
                    "",
                )
            ).lower()

            exception_text = (
                f"{exception_type or ''} "
                f"{exception_message or ''}"
            ).lower()

            timeout_text = (
                f"{operation_lower} "
                f"{exception_text}"
            )

            timeout_detected = any(
                word in timeout_text
                for word in [
                    "timeout",
                    "timed out",
                    "deadline exceeded",
                ]
            )

            # ------------------------------------------------
            # FAILURE DETECTION
            # ------------------------------------------------

            is_failure = False

            # 1. Explicit failure type
            if explicit_failure_type:
                is_failure = True

            # 2. Payment 402
            if (
                service == "payment-service"
                and status_code_int == 402
            ):

                is_failure = True

                if not explicit_failure_type:
                    explicit_failure_type = (
                        "payment_failure"
                    )

            # 3. HTTP 5XX
            if (
                status_code_int is not None
                and status_code_int >= 500
            ):

                is_failure = True

            # 4. Explicit error
            if error_tag is True:
                is_failure = True

            if (
                str(error_tag).lower()
                == "true"
            ):
                is_failure = True

            # 5. OTEL error
            if (
                str(otel_status).upper()
                == "ERROR"
            ):
                is_failure = True

            # 6. Exception
            if (
                exception_type
                or exception_message
            ):
                is_failure = True

            # 7. Failure words
            if span_contains_failure_text(
                span
            ):
                is_failure = True

            # 8. Timeout
            if timeout_detected:
                is_failure = True

            if not is_failure:
                continue

            # ------------------------------------------------
            # BUILD RESULT
            # ------------------------------------------------

            failure_trace = build_failure_trace(
                trace,
                span,
                explicit_failure_type,
                status_code_int,
                exception_type,
                exception_message,
                timeout_detected,
            )

            failure_traces.append(
                failure_trace
            )

    return failure_traces


# ============================================================
# PRODUCT-SPECIFIC FAILURE TRACE EXTRACTION
# ============================================================

def extract_failure_traces_for_product(
    product_id,
    limit=100,
):
    """
    Search failure traces across all SysSleuth services
    and return only traces belonging to the requested product.
    """

    all_traces = get_recent_traces_all_services(
        limit
    )

    matching_traces = []

    target_product_id = str(
        product_id
    )

    for trace in all_traces:

        spans = trace.get(
            "spans",
            [],
        )

        for span in spans:

            # ------------------------------------------------
            # PRODUCT ID
            # ------------------------------------------------

            product_value = get_first_tag(
                span,
                [
                    "failure.product_id",
                    "product_id",
                    "product.id",
                    "productId",
                    "http.path.product_id",
                ],
            )

            if product_value is None:
                continue

            if str(product_value) != target_product_id:
                continue

            # ------------------------------------------------
            # EXPLICIT FAILURE TYPE
            # ------------------------------------------------

            explicit_failure_type = get_first_tag(
                span,
                [
                    "failure.type",
                    "failure_type",
                    "failure.type.name",
                ],
            )

            explicit_failure_type = normalize_failure_type(
                explicit_failure_type
            )

            # ------------------------------------------------
            # STATUS CODE
            # ------------------------------------------------

            status_code = get_first_tag(
                span,
                [
                    "http.status_code",
                    "http.response.status_code",
                    "rpc.grpc.status_code",
                ],
            )

            try:

                status_code_int = (
                    int(status_code)
                    if status_code is not None
                    else None
                )

            except (
                ValueError,
                TypeError,
            ):

                status_code_int = None

            # ------------------------------------------------
            # ERROR
            # ------------------------------------------------

            error_tag = get_first_tag(
                span,
                [
                    "error",
                    "error.type",
                ],
            )

            # ------------------------------------------------
            # OTEL STATUS
            # ------------------------------------------------

            otel_status = get_first_tag(
                span,
                [
                    "otel.status_code",
                ],
            )

            # ------------------------------------------------
            # EXCEPTION
            # ------------------------------------------------

            exception_type = get_first_tag(
                span,
                [
                    "exception.type",
                ],
            )

            exception_message = get_first_tag(
                span,
                [
                    "exception.message",
                ],
            )

            # ------------------------------------------------
            # TIMEOUT
            # ------------------------------------------------

            operation_lower = str(
                span.get(
                    "operationName",
                    "",
                )
            ).lower()

            exception_text = (
                f"{exception_type or ''} "
                f"{exception_message or ''}"
            ).lower()

            timeout_text = (
                f"{operation_lower} "
                f"{exception_text}"
            )

            timeout_detected = any(
                word in timeout_text
                for word in [
                    "timeout",
                    "timed out",
                    "deadline exceeded",
                ]
            )

            # ------------------------------------------------
            # FAILURE CHECK
            # ------------------------------------------------

            is_failure = False

            if explicit_failure_type:
                is_failure = True

            if (
                get_process_service(
                    trace,
                    span,
                )
                == "payment-service"
                and status_code_int == 402
            ):
                is_failure = True

                if not explicit_failure_type:
                    explicit_failure_type = (
                        "payment_failure"
                    )

            if (
                status_code_int is not None
                and status_code_int >= 500
            ):
                is_failure = True

            if error_tag is True:
                is_failure = True

            if (
                str(error_tag).lower()
                == "true"
            ):
                is_failure = True

            if (
                str(otel_status).upper()
                == "ERROR"
            ):
                is_failure = True

            if (
                exception_type
                or exception_message
            ):
                is_failure = True

            if span_contains_failure_text(
                span
            ):
                is_failure = True

            if timeout_detected:
                is_failure = True

            if not is_failure:
                continue

            # ------------------------------------------------
            # BUILD TRACE
            # ------------------------------------------------

            failure_trace = build_failure_trace(
                trace,
                span,
                explicit_failure_type,
                status_code_int,
                exception_type,
                exception_message,
                timeout_detected,
            )

            matching_traces.append(
                failure_trace
            )

    # --------------------------------------------------------
    # MOST RECENT FAILURE FIRST
    # --------------------------------------------------------

    matching_traces.sort(
        key=lambda item: (
            item.get("start_time") or 0
        ),
        reverse=True,
    )

    return matching_traces