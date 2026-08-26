from fastapi import FastAPI, HTTPException
import psycopg2
from prometheus_fastapi_instrumentator import Instrumentator
from logging_config import setup_logging
import time
# OpenTelemetry
from opentelemetry import trace
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

trace.set_tracer_provider(
    TracerProvider(resource=resource)
)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://jaeger:4317",
    insecure=True
)

span_processor = BatchSpanProcessor(otlp_exporter)

trace.get_tracer_provider().add_span_processor(
    span_processor
)


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
# Get inventory
# --------------------------------------------------

@app.get("/inventory/{product_id}")
def get_inventory(product_id: int):
    # INTENTIONAL FAILURE FOR OBSERVABILITY TESTING
    if product_id == 9999:
        logger.error(
            "inventory_service_test_failure",
            extra={
                "product_id": product_id,
                "reason": "Intentional failure for SysSleuth testing"
            }
        )

        raise HTTPException(
            status_code=500,
            detail="Intentional inventory service failure"
        )
    # INTENTIONAL LATENCY FOR OBSERVABILITY TESTING
    if product_id == 8888:
        logger.warning(
        "inventory_service_test_latency",
        extra={
            "product_id": product_id,
            "delay_seconds": 5,
            "reason": "Intentional latency for SysSleuth testing"
        }
    )

    time.sleep(5)
        
    logger.info(
        "inventory_check_requested",
        extra={
            "product_id": product_id
        }
    )

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

    logger.info(
        "inventory_check_success",
        extra={
            "product_id": product_id,
            "stock": product[2]
        }
    )

    return {
        "product_id": product[0],
        "name": product[1],
        "stock": product[2]
    }


# --------------------------------------------------
# Reserve inventory
# --------------------------------------------------

@app.post("/inventory/{product_id}/reserve")
def reserve_inventory(product_id: int, quantity: int):

    logger.info(
        "inventory_reservation_requested",
        extra={
            "product_id": product_id,
            "quantity": quantity
        }
    )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT stock FROM inventory WHERE product_id = %s",
        (product_id,)
    )

    product = cursor.fetchone()

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

    if current_stock < quantity:

        logger.warning(
            "insufficient_stock",
            extra={
                "product_id": product_id,
                "requested": quantity,
                "available": current_stock
            }
        )

        cursor.close()
        conn.close()

        return {
            "success": False,
            "error": "Insufficient stock"
        }

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
