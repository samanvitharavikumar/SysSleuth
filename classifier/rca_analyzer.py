def analyze_failure(classification, logs, traces):
    """
    Convert failure classification + logs + traces
    into a SysSleuth root-cause analysis result.
    """

    failure_type = classification.get("failure_type", "UNKNOWN")
    service = classification.get("service", "unknown")
    reason = classification.get("reason", "Unknown failure")

    # Find the most relevant failure trace
    failure_trace = None

    for trace in traces:
        if trace.get("failure_type"):
            failure_trace = trace
            break

    # -----------------------------------
    # DATABASE FAILURE
    # -----------------------------------

    if failure_type == "DATABASE_FAILURE":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Database failure detected in inventory-service",
            "reason": reason,
            "confidence": 0.98,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # SERVICE CRASH
    # -----------------------------------

    elif failure_type == "SERVICE_CRASH":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Inventory service crashed during the request",
            "reason": reason,
            "confidence": 0.98,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # TIMEOUT
    # -----------------------------------

    elif failure_type == "TIMEOUT":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Inventory service experienced excessive latency and timed out",
            "reason": reason,
            "confidence": 0.98,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # PAYMENT FAILURE
    # -----------------------------------

    elif failure_type == "PAYMENT_FAILURE":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Payment service rejected or failed the payment request",
            "reason": reason,
            "confidence": 0.98,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # CASCADING FAILURE
    # -----------------------------------

    elif failure_type == "CASCADING_FAILURE":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Failure propagated from a dependent service",
            "reason": reason,
            "confidence": 0.95,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # INSUFFICIENT STOCK
    # -----------------------------------

    elif failure_type == "INSUFFICIENT_STOCK":

        result = {
            "failure_type": failure_type,
            "service": service,
            "root_cause": "Requested quantity exceeded available inventory",
            "reason": reason,
            "confidence": 0.99,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # UNKNOWN
    # -----------------------------------

    else:

        result = {
            "failure_type": "UNKNOWN",
            "service": service,
            "root_cause": "Unable to determine the root cause",
            "reason": reason,
            "confidence": 0.0,
            "evidence": {
                "logs_checked": len(logs),
                "failure_traces": len(traces)
            }
        }

    # -----------------------------------
    # ADD TRACE INFORMATION
    # -----------------------------------

    if failure_trace:

        result["trace"] = {
            "trace_id": failure_trace.get("trace_id"),
            "span_id": failure_trace.get("span_id"),
            "operation": failure_trace.get("operation"),
            "status_code": failure_trace.get("status_code"),
            "product_id": failure_trace.get("product_id"),
            "quantity": failure_trace.get("quantity")
        }

    return result