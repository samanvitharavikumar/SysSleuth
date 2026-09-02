from fastapi import FastAPI, HTTPException

from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
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

provider = TracerProvider(
    resource=resource
)

trace.set_tracer_provider(provider)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://jaeger:4317",
    insecure=True
)

span_processor = BatchSpanProcessor(
    otlp_exporter
)

provider.add_span_processor(
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

    # Get the current OpenTelemetry span
    span = trace.get_current_span()

    logger.info(
        "payment_started",
        extra={
            "order_id": order_id,
            "amount": amount
        }
    )

    # -----------------------------------
    # PAYMENT DECLINED - PRODUCT 8
    # -----------------------------------

    if order_id == 8:

        payment_failures_total.labels(
            failure_type="payment_declined"
        ).inc()

        # -----------------------------------
        # TRACE ATTRIBUTES
        # -----------------------------------

        span.set_attribute(
            "failure.type",
            "payment_failure"
        )

        span.set_attribute(
            "failure.product_id",
            order_id
        )

        span.set_attribute(
            "failure.quantity",
            1
        )

        span.set_attribute(
            "http.status_code",
            402
        )

        span.set_attribute(
            "payment.failure_type",
            "payment_declined"
        )

        # -----------------------------------
        # LOG
        # -----------------------------------

        logger.error(
            "payment_declined",
            extra={
                "order_id": order_id,
                "amount": amount,
                "reason": "Payment was declined by payment provider"
            }
        )

        # -----------------------------------
        # TRACE EXCEPTION
        # -----------------------------------

        span.record_exception(
            Exception(
                "Payment declined"
            )
        )

        span.set_status(
            Status(
                StatusCode.ERROR,
                "Payment declined"
            )
        )

        # Make sure telemetry is exported
        provider.force_flush()

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