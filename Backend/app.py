import os
import json
from typing import Literal, List, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
import requests

load_dotenv()
#test
name = 
# Configuration
CONFER_API_URL = "http://k08k808w884k0w0oswk0sw84.144.126.158.171.sslip.io"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = "https://litellm.confer.today"
QDRANT_URL = "https://qdrant.confersolutions.ai"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
LLM_MODEL = "gpt-4.1-nano"
EMBEDDING_MODEL = "text-embedding-3-small"

with open("prompts.json", "r", encoding="utf-8") as f:
    PROMPTS = json.load(f)

# Shared LLM and Vector Store instances
llm_router = ChatOpenAI(model=LLM_MODEL, temperature=0, base_url=OPENAI_API_BASE)
llm_rag = ChatOpenAI(model=LLM_MODEL, temperature=0, api_key=OPENAI_API_KEY, base_url=OPENAI_API_BASE)
llm_general = ChatOpenAI(model=LLM_MODEL, temperature=0.5, api_key=OPENAI_API_KEY, base_url=OPENAI_API_BASE)

qdrant_client = QdrantClient(url=QDRANT_URL, port=443, api_key=QDRANT_API_KEY)
embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL, api_key=OPENAI_API_KEY, base_url=OPENAI_API_BASE)
moxi_store = QdrantVectorStore(client=qdrant_client, collection_name="moxi-website", embedding=embeddings, content_payload_key="content")

# State & Data Models
class GraphState(TypedDict):
    question: str
    classification: Optional[str]
    documents: List[str]
    generation: str
    chat_history: List[BaseMessage]

class RouteQuery(BaseModel):
    datasource: Literal["confer", "moxi", "general"] = Field(..., description="Target domain")

# Node Definitions
def classify_query(state: GraphState):
    question, chat_history = state["question"], state.get("chat_history", [])
    q_lower = question.lower()

    if "confer" in q_lower:
        return {"classification": "confer"}
    if "moxi" in q_lower:
        return {"classification": "moxi"}

    history_context = ""
    if chat_history:
        history_context = "\n\nConversation history:\n" + "".join(
            f"{'User' if isinstance(msg, HumanMessage) else 'Assistant'}: {msg.content}\n" 
            for msg in chat_history[-6:]
        )

    prompt = ChatPromptTemplate.from_messages([("system", PROMPTS["classification"]), ("human", "{history_context}\nCurrent query: {question}")])
    result = (prompt | llm_router.with_structured_output(RouteQuery)).invoke({"question": question, "history_context": history_context})
    return {"classification": result.datasource}

def retrieve_moxi(state: GraphState):
    return {"documents": [d.page_content for d in moxi_store.similarity_search(state["question"], k=4)]}

def confer_langchain_agent(state: GraphState):
    question, chat_history = state["question"], state.get("chat_history", [])
    response = requests.post(f"{CONFER_API_URL}/chat", json={"question": question}, timeout=30)
    response.raise_for_status()
    answer = response.json()["answer"]
    return {"generation": answer, "chat_history": chat_history + [HumanMessage(content=question), AIMessage(content=answer)]}

def generate_response(state: GraphState):
    classification, documents = state.get("classification", "general"), state.get("documents", [])
    question, chat_history = state["question"], state.get("chat_history", [])
    
    if any(kw in question.lower() for kw in PROMPTS["harmful_keywords"]):
        return {"generation": PROMPTS["safety_message"], "chat_history": chat_history + [HumanMessage(content=question), AIMessage(content=PROMPTS["safety_message"])]}
    
    if classification in ["moxi", "confer"] and documents:
        system_prompt = f"You are a knowledgeable assistant specializing in {classification.upper()}.\n\n{PROMPTS['personality']}\n\n{PROMPTS['rag_principles']}\n\nContext:\n" + "\n\n".join(documents)
        llm = llm_rag
    else:
        system_prompt = f"You are a helpful AI assistant.\n\n{PROMPTS['personality']}\n\n{PROMPTS['general_guidance']}"
        llm = llm_general
    
    messages = [("system", system_prompt)]
    messages.extend(("human" if isinstance(msg, HumanMessage) else "assistant", msg.content) for msg in chat_history[-10:])
    messages.append(("human", question))
    
    answer = (ChatPromptTemplate.from_messages(messages) | llm).invoke({}).content
    return {"generation": answer, "chat_history": chat_history + [HumanMessage(content=question), AIMessage(content=answer)]}

# Graph Orchestration
workflow = StateGraph(GraphState)
workflow.add_node("classify", classify_query)
workflow.add_node("moxi_retriever", retrieve_moxi)
workflow.add_node("confer_langchain_agent", confer_langchain_agent)
workflow.add_node("generate_response", generate_response)
workflow.add_edge(START, "classify")
workflow.add_conditional_edges("classify", lambda x: x["classification"], {"moxi": "moxi_retriever", "confer": "confer_langchain_agent", "general": "generate_response"})
workflow.add_edge("moxi_retriever", "generate_response")
workflow.add_edge("confer_langchain_agent", END)
workflow.add_edge("generate_response", END)

app = workflow.compile(checkpointer=MemorySaver())

def chat_with_memory(question: str, thread_id: str = "default") -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    state = app.get_state(config)
    existing_history = state.values.get("chat_history", []) if state and state.values else []
    return app.invoke({"question": question, "chat_history": existing_history}, config=config)

def get_chat_history(thread_id: str = "default") -> List[BaseMessage]:
    config = {"configurable": {"thread_id": thread_id}}
    state = app.get_state(config)
    return state.values.get("chat_history", []) if state and state.values else []

if __name__ == "__main__":
    print("Starting interactive chat...\nType 'quit', 'exit', or 'q' to stop.\n")
    thread_id = "interactive_session"
    while True:
        query = input("User: ")
        if query.lower() in ["quit", "exit", "q"]:
            print("Exiting. Goodbye!")
            break
        if query.strip():
            print(f"Assistant: {chat_with_memory(query, thread_id)['generation']}")
