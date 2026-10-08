from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from graph import rca_graph
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
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