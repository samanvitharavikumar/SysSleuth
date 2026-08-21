from fastapi import FastAPI, HTTPException
import psycopg2
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from logging_config import setup_logging

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

logger = setup_logging("product-service")


# --------------------------------------------------
# OpenTelemetry
# --------------------------------------------------

resource = Resource.create({
    "service.name": "product-service"
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

app = FastAPI(title="Product Service")

Instrumentator().instrument(app).expose(app)

FastAPIInstrumentor.instrument_app(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
# Health
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "service": "product",
        "status": "healthy"
    }


# --------------------------------------------------
# Get all products
# --------------------------------------------------

@app.get("/products")
def get_products():

    logger.info("products_requested")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            product_id,
            category,
            product_name,
            product_url,
            image_url,
            rating,
            rating_count,
            price_inr,
            original_price_inr,
            discount,
            offer
        FROM products
        ORDER BY product_id
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    products = []

    for row in rows:
        products.append({
            "product_id": row[0],
            "category": row[1],
            "product_name": row[2],
            "product_url": row[3],
            "image_url": row[4],
            "rating": row[5],
            "rating_count": row[6],
            "price_inr": row[7],
            "original_price_inr": row[8],
            "discount": row[9],
            "offer": row[10]
        })

    logger.info(
        "products_request_success",
        extra={"count": len(products)}
    )

    return products


# --------------------------------------------------
# Get product by ID
# --------------------------------------------------

@app.get("/products/{product_id}")
def get_product(product_id: int):

    logger.info(
        "product_requested",
        extra={"product_id": product_id}
    )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            product_id,
            category,
            product_name,
            product_url,
            image_url,
            rating,
            rating_count,
            price_inr,
            original_price_inr,
            discount,
            offer
        FROM products
        WHERE product_id = %s
    """, (product_id,))

    product = cursor.fetchone()

    cursor.close()
    conn.close()

    if product is None:

        logger.warning(
            "product_not_found",
            extra={"product_id": product_id}
        )

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "product_id": product[0],
        "category": product[1],
        "product_name": product[2],
        "product_url": product[3],
        "image_url": product[4],
        "rating": product[5],
        "rating_count": product[6],
        "price_inr": product[7],
        "original_price_inr": product[8],
        "discount": product[9],
        "offer": product[10]
    }


# --------------------------------------------------
# Get products by category
# --------------------------------------------------

@app.get("/products/category/{category}")
def get_products_by_category(category: str):

    logger.info(
        "category_products_requested",
        extra={"category": category}
    )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            product_id,
            category,
            product_name,
            product_url,
            image_url,
            rating,
            rating_count,
            price_inr,
            original_price_inr,
            discount,
            offer
        FROM products
        WHERE LOWER(category) = LOWER(%s)
        ORDER BY product_id
    """, (category,))

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "product_id": row[0],
            "category": row[1],
            "product_name": row[2],
            "product_url": row[3],
            "image_url": row[4],
            "rating": row[5],
            "rating_count": row[6],
            "price_inr": row[7],
            "original_price_inr": row[8],
            "discount": row[9],
            "offer": row[10]
        }
        for row in rows
    ]