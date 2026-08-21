from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from fastapi import FastAPI, HTTPException
import httpx

from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

from logging_config import setup_logging

from opentelemetry.sdk.resources import Resource

from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter


# -----------------------------------
# OPENTELEMETRY
# -----------------------------------

resource = Resource.create({
    "service.name": "order-service"
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


# -----------------------------------
# FASTAPI
# -----------------------------------

app = FastAPI(title="Order Service")


# -----------------------------------
# PROMETHEUS CUSTOM ERROR METRIC
# -----------------------------------

errors_total = Counter(
    "service_errors_total",
    "Total number of service errors",
    ["service", "error_type"]
)


# -----------------------------------
# PROMETHEUS FASTAPI METRICS
# -----------------------------------

Instrumentator().instrument(app).expose(app)


# -----------------------------------
# LOGGING
# -----------------------------------

logger = setup_logging("order-service")


# -----------------------------------
# OPENTELEMETRY INSTRUMENTATION
# -----------------------------------

FastAPIInstrumentor.instrument_app(app)

HTTPXClientInstrumentor().instrument()


# -----------------------------------
# SERVICE URLs
# -----------------------------------

INVENTORY_URL = "http://inventory-service:8002"

PAYMENT_URL = "http://payment-service:8003"


# -----------------------------------
# HEALTH CHECK
# -----------------------------------

@app.get("/health")
def health():

    return {
        "service": "order",
        "status": "healthy"
    }


# -----------------------------------
# CREATE ORDER
# -----------------------------------

@app.post("/orders")
def create_order(item_id: str, amount: float):

    logger.info(
        "order_started",
        extra={
            "item_id": item_id,
            "amount": amount
        }
    )

    with httpx.Client(timeout=3.0) as client:

        # -----------------------------------
        # 1. CHECK INVENTORY
        # -----------------------------------

        try:

            logger.info(
                "inventory_check_started",
                extra={
                    "item_id": item_id
                }
            )

            inv_resp = client.get(
                f"{INVENTORY_URL}/inventory/{item_id}"
            )

            inv_resp.raise_for_status()

            inventory_data = inv_resp.json()

            logger.info(
                "inventory_check_success",
                extra={
                    "item_id": item_id,
                    "stock": inventory_data["stock"]
                }
            )

        except httpx.HTTPStatusError as e:

            errors_total.labels(
                service="order-service",
                error_type="inventory_http_error"
            ).inc()

            logger.error(
                "inventory_check_failed",
                extra={
                    "item_id": item_id,
                    "reason": str(e)
                }
            )

            raise HTTPException(
                status_code=502,
                detail="Inventory check failed"
            )

        except httpx.RequestError as e:

            errors_total.labels(
                service="order-service",
                error_type="inventory_unreachable"
            ).inc()

            logger.error(
                "inventory_service_unreachable",
                extra={
                    "item_id": item_id,
                    "reason": str(e)
                }
            )

            raise HTTPException(
                status_code=503,
                detail="Inventory service unreachable"
            )


        # -----------------------------------
        # 2. PAYMENT
        # -----------------------------------

        try:

            logger.info(
                "payment_started",
                extra={
                    "item_id": item_id,
                    "amount": amount
                }
            )

            pay_resp = client.post(
                f"{PAYMENT_URL}/payment",
                params={
                    "order_id": int(item_id),
                    "amount": amount
                }
            )

            pay_resp.raise_for_status()

            payment_data = pay_resp.json()

            logger.info(
                "payment_success",
                extra={
                    "item_id": item_id,
                    "amount": amount
                }
            )

        except httpx.HTTPStatusError as e:

            errors_total.labels(
                service="order-service",
                error_type="payment_http_error"
            ).inc()

            logger.error(
                "payment_failed",
                extra={
                    "item_id": item_id,
                    "reason": str(e)
                }
            )

            raise HTTPException(
                status_code=502,
                detail="Payment failed"
            )

        except httpx.RequestError as e:

            errors_total.labels(
                service="order-service",
                error_type="payment_unreachable"
            ).inc()

            logger.error(
                "payment_service_unreachable",
                extra={
                    "item_id": item_id,
                    "reason": str(e)
                }
            )

            raise HTTPException(
                status_code=503,
                detail="Payment service unreachable"
            )


    # -----------------------------------
    # 3. ORDER COMPLETED
    # -----------------------------------

    logger.info(
        "order_completed",
        extra={
            "item_id": item_id,
            "amount": amount
        }
    )

    return {
        "status": "order placed",
        "item_id": item_id,
        "amount": amount,
        "payment": payment_data
    }