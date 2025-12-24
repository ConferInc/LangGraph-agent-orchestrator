from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app import app as langgraph_app
import uvicorn

# FastAPI app
app = FastAPI(title="Confer & MoXi Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    classification: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Confer & MoXi Chatbot API is running"}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    result = langgraph_app.invoke({"question": request.question})
    
    return ChatResponse(
        answer=result["generation"],
        classification=result.get("classification", "general")
    )

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("Starting Confer & MoXi Chatbot API server...")
    print("API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
