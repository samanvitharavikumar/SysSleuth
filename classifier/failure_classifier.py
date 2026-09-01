# classifier/failure_classifier.py

def classify_failure(logs):
    """
    Classify a failure based on log messages.
    """

    for log in reversed(logs):

        # Service crash
        if "inventory_service_crash_test" in log:
            return {
                "failure_type": "SERVICE_CRASH",
                "service": "inventory-service",
                "reason": "Inventory service crashed"
            }

        # Timeout / latency
        if "inventory_service_timeout" in log:
            return {
                "failure_type": "TIMEOUT",
                "service": "inventory-service",
                "reason": "Inventory service timed out"
            }

        # Payment failure
        if "payment_declined" in log:
            return {
                "failure_type": "PAYMENT_FAILURE",
                "service": "payment-service",
                "reason": "Payment service failed"
            }

        # Cascading failure
        if "inventory_cascade_failure" in log:
            return {
                "failure_type": "CASCADING_FAILURE",
                "service": "order-service",
                "reason": "Failure propagated from a dependent service"
            }


         # Insufficient stock
        if "insufficient_stock" in log.lower():
             return {
            "failure_type": "INSUFFICIENT_STOCK",
            "service": "inventory-service",
            "reason": "Requested quantity exceeds available stock"
        }

    return {
        "failure_type": "UNKNOWN",
        "service": "unknown",
        "reason": "No matching failure pattern found"
    }