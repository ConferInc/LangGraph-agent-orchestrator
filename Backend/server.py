from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from app import chat_with_memory, get_chat_history
import uvicorn

app = FastAPI(title="Confer & MoXi Chatbot API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    question: str
    thread_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    answer: str
    classification: str
    thread_id: str

class HistoryMessage(BaseModel):
    role: str
    content: str

class HistoryResponse(BaseModel):
    thread_id: str
    messages: List[HistoryMessage]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Confer & MoXi Chatbot API is running"}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    thread_id = request.thread_id or "default"
    result = chat_with_memory(request.question, thread_id)
    return ChatResponse(answer=result["generation"], classification=result.get("classification", "general"), thread_id=thread_id)

@app.get("/history/{thread_id}", response_model=HistoryResponse)
def get_history(thread_id: str):
    history = get_chat_history(thread_id)
    return HistoryResponse(thread_id=thread_id, messages=[HistoryMessage(role="user" if msg.__class__.__name__ == "HumanMessage" else "assistant", content=msg.content) for msg in history])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)