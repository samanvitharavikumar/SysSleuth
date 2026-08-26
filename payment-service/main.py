from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from logging_config import setup_logging

# OpenTelemetry
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from fastapi import FastAPI, HTTPException
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor


# --------------------------------------------------
# Logging
# --------------------------------------------------

logger = setup_logging("payment-service")


# --------------------------------------------------
# OpenTelemetry
# --------------------------------------------------

resource = Resource.create({
    "service.name": "payment-service"
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

app = FastAPI(title="Payment Service")
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health():

    logger.info("payment_health_check")

    return {
        "service": "payment",
        "status": "healthy"
    }


# --------------------------------------------------
# Payment
# --------------------------------------------------

@app.post("/payment")
def process_payment(order_id: int, amount: float):
    if order_id == 9999:
        logger.error(
        "payment_service_test_failure",
        extra={
            "order_id": order_id,
            "amount": amount,
            "reason": "Intentional payment failure for SysSleuth testing"
        }
    )

    raise HTTPException(
        status_code=500,
        detail="Intentional payment service failure"
    )
    logger.info(
        "payment_requested",
        extra={
            "order_id": order_id,
            "amount": amount
        }
    )

    logger.info(
        "payment_success",
        extra={
            "order_id": order_id,
            "amount": amount
        }
    )

    return {
        "success": True,
        "order_id": order_id,
        "amount": amount,
        "message": "Payment successful"
    }