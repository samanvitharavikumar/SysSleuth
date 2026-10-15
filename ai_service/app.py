from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from graph import rca_graph
import requests
import json


# --------------------------------------------------
# CREATE FASTAPI APP
# --------------------------------------------------

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# USER RCA
# ==================================================

class RCARequest(BaseModel):
    message: str
    trace_id: str


# --------------------------------------------------
# HOME / HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "SysSleuth AI Service is running"
    }


# --------------------------------------------------
# USER RCA ENDPOINT
# --------------------------------------------------

@app.post("/ask")
def ask_llm(request: RCARequest):

    print(
        f"Received RCA request for trace: {request.trace_id}"
    )

    result = rca_graph.invoke({
        "message": request.message,
        "trace_id": request.trace_id,
        "evidence": "",
        "analysis": "",
        "answer": ""
    })

    return {
        "answer": result["answer"]
    }


# ==================================================
# ADMIN PROPOSED FIX
# ==================================================

class ProposedFixRequest(BaseModel):

    failure_type: str
    root_cause: str
    reason: str

    service: str | None = None
    confidence: float | None = None

    trace_id: str | None = None
    span_id: str | None = None
    operation: str | None = None
    status_code: int | None = None

    product_id: str | None = None
    quantity: int | None = None


# --------------------------------------------------
# ADMIN AI PROMPT
# --------------------------------------------------

def generate_proposed_fix(request: ProposedFixRequest):

    evidence = {
        "failure_type": request.failure_type,
        "root_cause": request.root_cause,
        "reason": request.reason,
        "service": request.service,
        "confidence": request.confidence,
        "trace_id": request.trace_id,
        "span_id": request.span_id,
        "operation": request.operation,
        "status_code": request.status_code,
        "product_id": request.product_id,
        "quantity": request.quantity,
    }

    prompt = f"""
You are the remediation assistant for SysSleuth,
an observability and root-cause-analysis system.

Your job is NOT to explain the incident to a customer.

Your job is to propose a technically useful fix for a
developer or system operator.

Use ONLY the RCA evidence provided below.

RCA EVIDENCE:
{json.dumps(evidence, indent=2)}

IMPORTANT RULES:

1. Explain the proposed fix in developer-understandable
   technical language.

2. Do not invent source-code changes that are not supported
   by the evidence.

3. Do not claim that a specific line of code is wrong unless
   the evidence explicitly identifies it.

4. Distinguish between:
   - what the telemetry proves
   - what the developer should investigate
   - what remediation is recommended

5. If the evidence is insufficient for an exact code-level
   fix, explicitly say that further investigation is required.

6. Focus on the service, operation, failure type and status
   code involved.

7. Give practical debugging/remediation steps.

8. Do NOT explain the incident like a customer support agent.

9. Return ONLY valid JSON.

Return exactly this structure:

{{
    "recommended_action": "The main technical remediation.",
    "why": "Why this remediation follows from the RCA evidence.",
    "developer_investigation": [
        "Technical investigation step 1",
        "Technical investigation step 2",
        "Technical investigation step 3"
    ],
    "expected_result": "What should happen after the issue is fixed.",
    "confidence": "HIGH"
}}
"""

    response = requests.post(
        "http://host.docker.internal:11434/api/generate",
        json={
            "model": "gemma3",
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )

    response.raise_for_status()

    data = response.json()

    raw_answer = data["response"].strip()

    # --------------------------------------------------
    # Remove accidental markdown code fences
    # --------------------------------------------------

    if raw_answer.startswith("```"):
        raw_answer = raw_answer.replace("```json", "")
        raw_answer = raw_answer.replace("```", "")
        raw_answer = raw_answer.strip()

    # --------------------------------------------------
    # Parse Gemma JSON
    # --------------------------------------------------

    try:
        result = json.loads(raw_answer)

    except json.JSONDecodeError:

        return {
            "recommended_action": raw_answer,
            "why": "Gemma returned a non-structured response.",
            "developer_investigation": [],
            "expected_result": "Further investigation is required.",
            "confidence": "UNKNOWN"
        }

    return result


# --------------------------------------------------
# ADMIN PROPOSED FIX ENDPOINT
# --------------------------------------------------

@app.post("/propose-fix")
def propose_fix(request: ProposedFixRequest):

    print(
        f"Generating proposed fix for "
        f"{request.failure_type} "
        f"in {request.service}"
    )

    result = generate_proposed_fix(request)

    return result
@app.post("/propose-fix")
def propose_fix(request: ProposedFixRequest):
    result = generate_proposed_fix(request)

    print("\n=== AI PROPOSED FIX ===")
    print(result)

    return result