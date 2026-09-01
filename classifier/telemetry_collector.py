import requests


JAEGER_URL = "http://localhost:16686"


def get_recent_traces(service_name, limit=100):
    """
    Fetch recent traces for a service from Jaeger.
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


def get_tag(span, key):
    """
    Get a tag value from a Jaeger span.
    """
    for tag in span.get("tags", []):
        if tag.get("key") == key:
            return tag.get("value")

    return None


def get_process_service(trace, span):
    """
    Determine the service name for a span using Jaeger's process map.
    """
    process_id = span.get("processID")

    processes = trace.get("processes", {})

    if process_id and process_id in processes:
        service_name = processes[process_id].get("serviceName")

        if service_name:
            return service_name

    return None


def get_first_tag(span, keys):
    """
    Return the first non-empty tag matching any of the supplied keys.
    """
    for key in keys:
        value = get_tag(span, key)

        if value is not None:
            return value

    return None


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

    # Check tags
    for tag in span.get("tags", []):

        key = str(tag.get("key", "")).lower()
        value = str(tag.get("value", "")).lower()

        combined = f"{key} {value}"

        if any(word in combined for word in failure_words):
            return True

    # Check logs
    for log in span.get("logs", []):

        for field in log.get("fields", []):

            key = str(field.get("key", "")).lower()
            value = str(field.get("value", "")).lower()

            combined = f"{key} {value}"

            if any(word in combined for word in failure_words):
                return True

    return False


def extract_failure_traces(service_name, limit=100):
    """
    Extract failure-related spans from Jaeger traces.

    This version supports:
    - HTTP 5xx failures
    - OpenTelemetry ERROR status
    - error=true
    - exceptions
    - timeout/deadline messages
    - timeout-like long running spans
    - span log failures
    """

    traces = get_recent_traces(service_name, limit)

    failure_traces = []

    for trace in traces:

        trace_id = trace.get("traceID")

        spans = trace.get("spans", [])

        for span in spans:

            span_id = span.get("spanID")

            operation = span.get("operationName", "")

            service = get_process_service(trace, span)

            # --------------------------------------------------
            # STATUS CODE
            # --------------------------------------------------

            status_code = get_first_tag(
                span,
                [
                    "http.status_code",
                    "http.response.status_code",
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

            except (ValueError, TypeError):
                status_code_int = None

            # --------------------------------------------------
            # ERROR / OTEL STATUS
            # --------------------------------------------------

            error_tag = get_first_tag(
                span,
                [
                    "error",
                    "error.type",
                ],
            )

            otel_status = get_first_tag(
                span,
                [
                    "otel.status_code",
                    "otel.status_code",
                ],
            )

            exception_type = get_first_tag(
                span,
                [
                    "exception.type",
                    "exception.type",
                ],
            )

            exception_message = get_first_tag(
                span,
                [
                    "exception.message",
                    "exception.message",
                ],
            )

            # --------------------------------------------------
            # TIMING
            # --------------------------------------------------

            start_time = span.get("startTime")

            duration = span.get("duration")

            duration_ms = None

            if duration is not None:

                try:
                    duration_ms = round(int(duration) / 1000, 2)

                except (ValueError, TypeError):
                    duration_ms = None

            # --------------------------------------------------
            # END TIME
            # --------------------------------------------------

            end_time = None

            if start_time is not None and duration is not None:

                try:
                    end_time = int(start_time) + int(duration)

                except (ValueError, TypeError):
                    end_time = None

            # --------------------------------------------------
            # FAILURE DETECTION
            # --------------------------------------------------

            is_failure = False

            # HTTP 5xx
            if (
                status_code_int is not None
                and status_code_int >= 500
            ):
                is_failure = True

            # Explicit error tag
            if error_tag is True:
                is_failure = True

            if str(error_tag).lower() == "true":
                is_failure = True

            # OpenTelemetry ERROR
            if str(otel_status).upper() == "ERROR":
                is_failure = True

            # Exception
            if exception_type or exception_message:
                is_failure = True

            # Error/failure words anywhere in span
            if span_contains_failure_text(span):
                is_failure = True

            # --------------------------------------------------
            # TIMEOUT DETECTION
            # --------------------------------------------------

            operation_lower = str(operation).lower()

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
                    "deadline",
                    "deadline exceeded",
                ]
            )

            # A timeout can exist without an HTTP 5xx tag.
            if timeout_detected:
                is_failure = True

            # --------------------------------------------------
            # LONG RUNNING INVENTORY RESERVATION
            # --------------------------------------------------
            #
            # Your failure scenario is an inventory timeout.
            # If the reserve operation takes several seconds,
            # treat it as a timeout even if instrumentation did
            # not attach an explicit ERROR tag.
            #

            if (
                duration_ms is not None
                and duration_ms >= 4000
                and (
                    "inventory" in operation_lower
                    or "reserve" in operation_lower
                )
            ):
                is_failure = True

                timeout_detected = True

            # --------------------------------------------------
            # NORMAL SPANS ARE IGNORED
            # --------------------------------------------------

            if not is_failure:
                continue

           # --------------------------------------------------
            # PRODUCT ID
            # --------------------------------------------------

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

            # --------------------------------------------------
            # QUANTITY
            # --------------------------------------------------

            quantity = get_first_tag(
                span,
                [
                    "failure.quantity",
                    "quantity",
                    "product.quantity",
                    "product_quantity",
                ],
            )
            # --------------------------------------------------
            # HTTP METHOD
            # --------------------------------------------------

            http_method = get_first_tag(
                span,
                [
                    "http.method",
                    "http.request.method",
                ],
            )

            # --------------------------------------------------
            # FAILURE TYPE
            # --------------------------------------------------

            if timeout_detected:

                failure_type = "timeout"

            elif (
                status_code_int is not None
                and status_code_int >= 500
            ):

                failure_type = "service_failure"

            elif exception_type:

                exception_lower = str(exception_type).lower()

                if (
                    "database" in exception_lower
                    or "sql" in exception_lower
                ):
                    failure_type = "database_failure"

                else:
                    failure_type = "service_failure"

            else:

                failure_type = "service_failure"

            # --------------------------------------------------
            # RESULT
            # --------------------------------------------------

            failure_traces.append(
                {
                    "trace_id": trace_id,
                    "span_id": span_id,
                    "operation": operation,
                    "failure_type": failure_type,
                    "http_method": http_method,
                    "product_id": product_id,
                    "quantity": quantity,
                    "status_code": status_code_int,
                    "service": service or service_name,
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration_ms": duration_ms,
                }
            )

    return failure_traces