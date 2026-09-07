from fastapi import FastAPI
from pydantic import BaseModel

from graph import rca_graph


app = FastAPI()


class RCARequest(BaseModel):
    message: str
    trace_id: str


@app.get("/")
def home():
    return {
        "message": "SysSleuth AI Service is running"
    }


@app.post("/ask")
def ask_llm(request: RCARequest):

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