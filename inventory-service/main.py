from fastapi import FastAPI, HTTPException
import psycopg2
from prometheus_fastapi_instrumentator import Instrumentator
from logging_config import setup_logging
import time
import os

# --------------------------------------------------
# OpenTelemetry
# --------------------------------------------------
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor


# --------------------------------------------------
# Logging
# --------------------------------------------------
logger = setup_logging("inventory-service")


# --------------------------------------------------
# OpenTelemetry
# --------------------------------------------------
resource = Resource.create({
    "service.name": "inventory-service"
})

provider = TracerProvider(resource=resource)

trace.set_tracer_provider(provider)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://otel-collector:4317",
    insecure=True
)

span_processor = BatchSpanProcessor(otlp_exporter)

provider.add_span_processor(span_processor)


# --------------------------------------------------
# FastAPI
# --------------------------------------------------
app = FastAPI(title="Inventory Service")

Instrumentator().instrument(app).expose(app)

FastAPIInstrumentor.instrument_app(app)


# --------------------------------------------------
# Health
# --------------------------------------------------
@app.get("/health")
def health():
    return {
        "service": "inventory",
        "status": "healthy"
    }


# --------------------------------------------------
# Database connection
# --------------------------------------------------
def get_db_connection():
    return psycopg2.connect(
        host="postgres",
        port=5432,
        database="syssleuth_inventory",
        user="postgres",
        password="password123"
    )


# --------------------------------------------------
# Failure Injection Controls
# --------------------------------------------------
INVENTORY_FAILURE_ENABLED = False
INVENTORY_LATENCY_ENABLED = False


# ==================================================
# GET INVENTORY
# ==================================================

@app.get("/inventory/{product_id}")
def get_inventory(product_id: int):

    span = trace.get_current_span()

    # --------------------------------------------------
    # INTENTIONAL INVENTORY FAILURE
    # --------------------------------------------------
    if INVENTORY_FAILURE_ENABLED and product_id == 9999:

        logger.error(
            "inventory_service_test_failure",
            extra={
                "product_id": product_id,
                "reason": "Intentional failure for SysSleuth testing"
            }
        )

        span.set_attribute(
            "failure.type",
            "service_failure"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.set_attribute(
            "http.status_code",
            500
        )

        span.record_exception(
            Exception(
                "Intentional inventory service failure"
            )
        )

        span.set_status(
            Status(
                StatusCode.ERROR,
                "Intentional inventory service failure"
            )
        )

        raise HTTPException(
            status_code=500,
            detail="Intentional inventory service failure"
        )

    # --------------------------------------------------
    # INTENTIONAL LATENCY
    # --------------------------------------------------
    if INVENTORY_LATENCY_ENABLED and product_id == 8888:

        logger.warning(
            "inventory_service_test_latency",
            extra={
                "product_id": product_id,
                "delay_seconds": 5,
                "reason": "Intentional latency for SysSleuth testing"
            }
        )

        time.sleep(5)

    # --------------------------------------------------
    # NORMAL REQUEST LOG
    # --------------------------------------------------
    logger.info(
        "inventory_check_requested",
        extra={
            "product_id": product_id
        }
    )

    # --------------------------------------------------
    # INTENTIONAL SERVICE CRASH
    # --------------------------------------------------
    if product_id == 5:

        logger.critical(
            "inventory_service_crash_test",
            extra={
                "product_id": product_id,
                "quantity": 1,
                "reason": "Intentional service crash for SysSleuth testing"
            }
        )

        span.set_attribute(
            "failure.type",
            "service_crash"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.record_exception(
            Exception(
                "Intentional service crash for SysSleuth testing"
            )
        )

        span.set_status(
            Status(
                StatusCode.ERROR,
                "Inventory service crashed"
            )
        )

        # Make sure telemetry is exported
        provider.force_flush()

        os._exit(1)

    # --------------------------------------------------
    # DATABASE
    # --------------------------------------------------
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT product_id, name, stock
        FROM inventory
        WHERE product_id = %s
        """,
        (product_id,)
    )

    product = cursor.fetchone()

    cursor.close()
    conn.close()

    # --------------------------------------------------
    # PRODUCT NOT FOUND
    # --------------------------------------------------
    if product is None:

        logger.warning(
            "product_not_found",
            extra={
                "product_id": product_id
            }
        )

        return {
            "error": "Product not found"
        }

    # --------------------------------------------------
    # SUCCESS
    # --------------------------------------------------
    logger.info(
        "inventory_check_success",
        extra={
            "product_id": product[0],
            "stock": product[2]
        }
    )

    return {
        "product_id": product[0],
        "name": product[1],
        "stock": product[2]
    }


# ==================================================
# RESERVE INVENTORY
# ==================================================

@app.post("/inventory/{product_id}/reserve")
def reserve_inventory(product_id: int, quantity: int):

    # --------------------------------------------------
    # GET CURRENT OTEL SPAN
    # --------------------------------------------------
    span = trace.get_current_span()

    logger.info(
        "inventory_reservation_requested",
        extra={
            "product_id": product_id,
            "quantity": quantity
        }
    )

    # ==================================================
    # DATABASE FAILURE - PRODUCT 4
    # ==================================================

    if product_id == 4:

        logger.error(
            "database_failure_test",
            extra={
                "product_id": product_id,
                "quantity": quantity,
                "reason": "Intentional database failure for SysSleuth testing"
            }
        )

        # -----------------------------
        # TRACE ATTRIBUTES
        # -----------------------------
        span.set_attribute(
            "failure.type",
            "database_failure"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.set_attribute(
            "failure.quantity",
            quantity
        )

        span.set_attribute(
            "http.status_code",
            503
        )

        # -----------------------------
        # EXCEPTION
        # -----------------------------
        span.record_exception(
            Exception(
                "Intentional database failure for SysSleuth testing"
            )
        )

        # -----------------------------
        # SPAN STATUS
        # -----------------------------
        span.set_status(
            Status(
                StatusCode.ERROR,
                "Database unavailable"
            )
        )

        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )

    # ==================================================
    # SERVICE CRASH - PRODUCT 5
    # ==================================================

    if product_id == 5:

        logger.critical(
            "inventory_service_crash_test",
            extra={
                "product_id": product_id,
                "quantity": quantity,
                "reason": "Intentional service crash for SysSleuth testing"
            }
        )

        # -----------------------------
        # TRACE ATTRIBUTES
        # -----------------------------
        span.set_attribute(
            "failure.type",
            "service_crash"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.set_attribute(
            "failure.quantity",
            quantity
        )

        # -----------------------------
        # EXCEPTION
        # -----------------------------
        span.record_exception(
            Exception(
                "Intentional service crash for SysSleuth testing"
            )
        )

        # -----------------------------
        # SPAN STATUS
        # -----------------------------
        span.set_status(
            Status(
                StatusCode.ERROR,
                "Inventory service crashed"
            )
        )

        # -----------------------------
        # FLUSH TELEMETRY
        # -----------------------------
        provider.force_flush()

        # -----------------------------
        # ACTUAL CRASH
        # -----------------------------
        os._exit(1)

        # -----------------------------------
    # INTENTIONAL LATENCY / TIMEOUT - PRODUCT 6
    # -----------------------------------
    if product_id == 6:

        # Get the current OpenTelemetry span
        span = trace.get_current_span()

        # Attach failure information to the trace
        span.set_attribute("failure.type", "timeout")
        span.set_attribute("failure.product_id", product_id)
        span.set_attribute("failure.quantity", quantity)

        # Attach HTTP information
        span.set_attribute("http.method", "POST")

        logger.warning(
            "inventory_service_test_latency",
            extra={
                "product_id": product_id,
                "quantity": quantity,
                "delay_seconds": 7,
                "reason": "Intentional latency for SysSleuth testing"
            }
        )

        time.sleep(7)

        logger.error(
            "inventory_service_timeout",
            extra={
                "product_id": product_id,
                "quantity": quantity,
                "reason": "Intentional timeout for SysSleuth testing"
            }
        )

        # Mark OpenTelemetry span as failed
        span.record_exception(
            Exception("Inventory service timeout")
        )

        span.set_status(
            Status(
                StatusCode.ERROR,
                "Inventory service timed out"
            )
        )

        raise HTTPException(
            status_code=504,
            detail="Timed out"
        )

    # ==================================================
    # CASCADING FAILURE - PRODUCT 7
    # ==================================================

    if product_id == 7:

        logger.error(
            "inventory_cascade_failure",
            extra={
                "product_id": product_id,
                "quantity": quantity,
                "reason": "Intentional inventory failure to trigger cascading failure"
            }
        )

        # -----------------------------
        # TRACE ATTRIBUTES
        # -----------------------------
        span.set_attribute(
            "failure.type",
            "service_failure"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.set_attribute(
            "failure.quantity",
            quantity
        )

        span.set_attribute(
            "http.status_code",
            500
        )

        # -----------------------------
        # EXCEPTION
        # -----------------------------
        span.record_exception(
            Exception(
                "Inventory service cascading failure"
            )
        )

        # -----------------------------
        # SPAN STATUS
        # -----------------------------
        span.set_status(
            Status(
                StatusCode.ERROR,
                "Inventory service failed"
            )
        )

        raise HTTPException(
            status_code=500,
            detail="Inventory service failed"
        )

    # ==================================================
    # DATABASE
    # ==================================================

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT stock FROM inventory WHERE product_id = %s",
        (product_id,)
    )

    product = cursor.fetchone()

    # --------------------------------------------------
    # PRODUCT NOT FOUND
    # --------------------------------------------------
    if product is None:

        logger.warning(
            "product_not_found",
            extra={
                "product_id": product_id
            }
        )

        cursor.close()
        conn.close()

        return {
            "success": False,
            "error": "Product not found"
        }

    current_stock = product[0]

    # ==================================================
    # INSUFFICIENT STOCK
    # ==================================================

    if current_stock < quantity:

        logger.warning(
            "insufficient_stock",
            extra={
                "product_id": product_id,
                "requested": quantity,
                "available": current_stock
            }
        )

        # -----------------------------
        # TRACE ATTRIBUTES
        # -----------------------------
        span.set_attribute(
            "failure.type",
            "insufficient_stock"
        )

        span.set_attribute(
            "failure.product_id",
            product_id
        )

        span.set_attribute(
            "failure.quantity",
            quantity
        )

        span.set_attribute(
            "http.status_code",
            400
        )

        # -----------------------------
        # EXCEPTION
        # -----------------------------
        span.record_exception(
            Exception(
                "Insufficient inventory"
            )
        )

        # -----------------------------
        # SPAN STATUS
        # -----------------------------
        span.set_status(
            Status(
                StatusCode.ERROR,
                "Insufficient inventory"
            )
        )

        cursor.close()
        conn.close()

        return {
            "success": False,
            "error": "Insufficient stock"
        }

    # ==================================================
    # RESERVE STOCK
    # ==================================================

    new_stock = current_stock - quantity

    cursor.execute(
        "UPDATE inventory SET stock = %s WHERE product_id = %s",
        (new_stock, product_id)
    )

    conn.commit()

    cursor.close()
    conn.close()

    logger.info(
        "inventory_reserved",
        extra={
            "product_id": product_id,
            "quantity": quantity,
            "remaining_stock": new_stock
        }
    )

    return {
        "success": True,
        "remaining_stock": new_stock
    }