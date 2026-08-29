from fastapi import FastAPI, HTTPException

from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource

from logging_config import setup_logging


# -----------------------------------
# OPENTELEMETRY
# -----------------------------------

resource = Resource.create({
    "service.name": "payment-service"
})

trace.set_tracer_provider(
    TracerProvider(
        resource=resource
    )
)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://jaeger:4317",
    insecure=True
)

span_processor = BatchSpanProcessor(
    otlp_exporter
)

trace.get_tracer_provider().add_span_processor(
    span_processor
)


# -----------------------------------
# FASTAPI
# -----------------------------------

app = FastAPI(
    title="Payment Service"
)


# -----------------------------------
# PROMETHEUS
# -----------------------------------

Instrumentator().instrument(app).expose(app)

payment_failures_total = Counter(
    "payment_failures_total",
    "Total number of payment failures",
    ["failure_type"]
)


# -----------------------------------
# LOGGING
# -----------------------------------

logger = setup_logging(
    "payment-service"
)


# -----------------------------------
# OPENTELEMETRY INSTRUMENTATION
# -----------------------------------

FastAPIInstrumentor.instrument_app(app)


# -----------------------------------
# HEALTH CHECK
# -----------------------------------

@app.get("/health")
def health():

    return {
        "service": "payment",
        "status": "healthy"
    }


# -----------------------------------
# PROCESS PAYMENT
# -----------------------------------

@app.post("/payment")
def process_payment(
    order_id: int,
    amount: float
):

    logger.info(
        "payment_started",
        extra={
            "order_id": order_id,
            "amount": amount
        }
    )

    # -----------------------------------
    # PAYMENT DECLINED
    # -----------------------------------

    if order_id == 8:

        payment_failures_total.labels(
            failure_type="payment_declined"
        ).inc()

        logger.error(
            "payment_declined",
            extra={
                "order_id": order_id,
                "amount": amount,
                "reason": "Payment was declined by payment provider"
            }
        )

        raise HTTPException(
            status_code=402,
            detail="Payment declined"
        )

    # -----------------------------------
    # NORMAL PAYMENT
    # -----------------------------------

    logger.info(
        "payment_success",
        extra={
            "order_id": order_id,
            "amount": amount
        }
    )

    return {
        "status": "payment successful",
        "order_id": order_id,
        "amount": amount
    }