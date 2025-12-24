# Confer & MoXi AI Chatbot

A multi-agent RAG chatbot built with LangGraph that intelligently routes queries to specialized agents for Confer AI solutions and MoXi mortgage services.

## Architecture

![LangGraph Workflow](Backend/graph.png)

The system uses a LangGraph workflow with:
- **Classify Node** - Routes queries to the appropriate agent based on content
- **Confer LangChain Agent** - Handles Confer AI/ML consulting queries via external API
- **MoXi Retriever** - Retrieves Mexico real estate financing information from Qdrant
- **Generate Response** - Produces final responses for MoXi and general queries

## Tech Stack

**Backend:**
- FastAPI + Uvicorn
- LangChain + LangGraph
- Qdrant Vector Database
- OpenAI GPT-4

**Frontend:**
- Next.js 14
- React
- Tailwind CSS
- Axios

## Local Development

### Backend
```bash
cd Backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python server.py
```

### Frontend
```bash
cd Frontend
npm install
cp .env.example .env.local  # Set backend URL
npm run dev
```
