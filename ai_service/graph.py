from typing import TypedDict
import os
import requests

from dotenv import load_dotenv
from google import genai
from langgraph.graph import StateGraph, START, END


# Load environment variables
load_dotenv()


# Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# --------------------------------------------------
# STATE
# --------------------------------------------------

class RCAState(TypedDict):
    message: str
    trace_id: str
    evidence: str
    analysis: str
    answer: str


# --------------------------------------------------
# HELPER
# --------------------------------------------------

def get_tag(tags, key):
    for tag in tags:
        if tag.get("key") == key:
            return tag.get("value")

    return None


# --------------------------------------------------
# STEP 1: GET TRACE FROM JAEGER
# --------------------------------------------------

def get_trace(state: RCAState):

    print("Fetching trace from Jaeger...")

    trace_id = state["trace_id"]

    url = f"http://localhost:16686/api/traces/{trace_id}"

    response = requests.get(
        url,
        timeout=10
    )

    response.raise_for_status()

    trace_data = response.json()

    evidence = parse_trace(trace_data)

    return {
        "evidence": evidence
    }


# --------------------------------------------------
# STEP 2: PARSE JAEGER TRACE
# --------------------------------------------------

def parse_trace(trace_data):

    traces = trace_data.get("data", [])

    if not traces:
        return "No trace data was found."

    trace = traces[0]

    spans = trace.get("spans", [])

    processes = trace.get("processes", {})

    services = set()

    operations = []

    errors = []

    http_statuses = []

    slow_operations = []


    # ----------------------------------------------
    # Process every span
    # ----------------------------------------------

    for span in spans:

        operation_name = span.get(
            "operationName",
            "unknown"
        )

        duration_us = span.get(
            "duration",
            0
        )

        duration_ms = duration_us / 1000


        # ------------------------------------------
        # Find service name
        # ------------------------------------------

        process_id = span.get("processID")

        process = processes.get(
            process_id,
            {}
        )

        process_tags = process.get(
            "tags",
            []
        )

        service_name = get_tag(
            process_tags,
            "service.name"
        )

        if not service_name:

            service_name = process.get(
                "serviceName",
                "unknown-service"
            )

        services.add(service_name)


        # ------------------------------------------
        # Store operation
        # ------------------------------------------

        operations.append({
            "service": service_name,
            "operation": operation_name,
            "duration_ms": round(
                duration_ms,
                2
            )
        })


        # ------------------------------------------
        # HTTP status code
        # ------------------------------------------

        span_tags = span.get(
            "tags",
            []
        )

        status_code = get_tag(
            span_tags,
            "http.status_code"
        )

        if status_code is not None:

            try:

                status_code = int(
                    status_code
                )

                http_statuses.append(
                    status_code
                )

            except (
                ValueError,
                TypeError
            ):

                pass


        # ------------------------------------------
        # Error information
        # ------------------------------------------

        error_tag = get_tag(
            span_tags,
            "error"
        )

        status_message = get_tag(
            span_tags,
            "otel.status_description"
        )

        otel_status_code = get_tag(
            span_tags,
            "otel.status_code"
        )


        # Detect errors
        if (
            error_tag is True
            or error_tag == "true"
            or otel_status_code == "ERROR"
            or (
                status_code is not None
                and isinstance(status_code, int)
                and status_code >= 400
            )
        ):

            errors.append({
                "service": service_name,
                "operation": operation_name,
                "status_code": status_code,
                "message": status_message
            })


        # ------------------------------------------
        # Detect slow operations
        # ------------------------------------------

        if duration_ms >= 300:

            slow_operations.append({
                "service": service_name,
                "operation": operation_name,
                "duration_ms": round(
                    duration_ms,
                    2
                )
            })


    # --------------------------------------------------
    # BUILD CLEAN EVIDENCE
    # --------------------------------------------------

    evidence = []


    evidence.append(
        "TRACE SUMMARY"
    )

    evidence.append(
        f"Total spans: {len(spans)}"
    )

    evidence.append(
        f"Services: {', '.join(sorted(services))}"
    )


    # --------------------------------------------------
    # OPERATIONS
    # --------------------------------------------------

    evidence.append(
        "\nOPERATIONS"
    )

    for operation in operations:

        evidence.append(
            f"- {operation['service']} → "
            f"{operation['operation']} → "
            f"{operation['duration_ms']} ms"
        )


    # --------------------------------------------------
    # HTTP STATUS CODES
    # --------------------------------------------------

    evidence.append(
        "\nHTTP STATUS CODES"
    )

    if http_statuses:

        status_counts = {}

        for status in http_statuses:

            status_counts[status] = (
                status_counts.get(status, 0) + 1
            )

        for status, count in sorted(
            status_counts.items()
        ):

            evidence.append(
                f"- HTTP {status}: "
                f"{count} span(s)"
            )

    else:

        evidence.append(
            "- No HTTP status codes found"
        )


    # --------------------------------------------------
    # ERRORS
    # --------------------------------------------------

    evidence.append(
        "\nERRORS"
    )

    if errors:

        for error in errors:

            evidence.append(
                f"- Service: {error['service']} | "
                f"Operation: {error['operation']} | "
                f"HTTP: {error['status_code']} | "
                f"Message: {error['message']}"
            )

    else:

        evidence.append(
            "- No errors detected in trace"
        )


    # --------------------------------------------------
    # SLOW OPERATIONS
    # --------------------------------------------------

    evidence.append(
        "\nSLOW OPERATIONS (>= 300 ms)"
    )

    if slow_operations:

        slow_operations.sort(
            key=lambda x: x["duration_ms"],
            reverse=True
        )

        for operation in slow_operations:

            evidence.append(
                f"- {operation['service']} → "
                f"{operation['operation']} → "
                f"{operation['duration_ms']} ms"
            )

    else:

        evidence.append(
            "- No operations exceeded 300 ms"
        )


    return "\n".join(evidence)


# --------------------------------------------------
# STEP 3: USER-FRIENDLY GEMINI ANALYSIS
# --------------------------------------------------

def analyze_evidence(state: RCAState):

    print(
        "Analyzing evidence with Gemini..."
    )


    prompt = f"""
You are SysSleuth's customer support assistant.

A customer experienced a checkout problem.

Customer message:
{state['message']}

Trace ID:
{state['trace_id']}

System evidence:
-------------------------
{state['evidence']}
-------------------------

Your job is to explain the incident to the customer.

Write a short, clear and friendly explanation.

Use exactly these sections:

### What happened?

Explain the problem in simple language.

### What does this mean?

Explain what happened to the customer's order or checkout.

### What can I do?

Give the customer a simple next step.

IMPORTANT RULES:

- The customer is NOT technical.
- Do NOT mention Jaeger.
- Do NOT mention traces or spans.
- Do NOT mention HTTP status codes.
- Do NOT mention OpenTelemetry.
- Do NOT mention internal service names.
- Do NOT mention databases unless necessary for a simple explanation.
- Do NOT invent information.
- Do NOT claim a specific root cause unless the evidence actually supports it.
- If the exact cause cannot be determined, clearly say that the exact cause could not be confirmed.
- If the evidence only indicates latency or a temporary issue, explain that simply.
- Keep the response concise.
- Be reassuring but do not make promises.

The goal is to answer:

"What happened to my checkout, and what should I do?"
"""


    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )


    return {
        "analysis": response.text
    }


# --------------------------------------------------
# STEP 4: FINAL ANSWER
# --------------------------------------------------

def generate_answer(state: RCAState):

    print(
        "Generating final user response..."
    )

    return {
        "answer": state["analysis"]
    }


# --------------------------------------------------
# LANGGRAPH WORKFLOW
# --------------------------------------------------

graph = StateGraph(RCAState)


graph.add_node(
    "get_trace",
    get_trace
)

graph.add_node(
    "analyze_evidence",
    analyze_evidence
)

graph.add_node(
    "generate_answer",
    generate_answer
)


# Workflow
graph.add_edge(
    START,
    "get_trace"
)

graph.add_edge(
    "get_trace",
    "analyze_evidence"
)

graph.add_edge(
    "analyze_evidence",
    "generate_answer"
)

graph.add_edge(
    "generate_answer",
    END
)


# Compile
rca_graph = graph.compile()