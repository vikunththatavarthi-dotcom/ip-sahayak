# IP-SAKTI Sahayak

**Grounded decision-support for Indian IP and AYUSH regulatory guidance.**

> IP-SAKTI Sahayak provides informational guidance based on referenced official sources. It is not a substitute for professional legal advice or official government decisions. Please verify deadlines and legal conclusions against the latest official source.

---

## Architecture

```
User (text / voice / PDF)
        │
        ▼
   Next.js Frontend  ── chat, upload, source cards, action cards
        │  (REST/JSON)
        ▼
   FastAPI Backend (modular routers)
        │
   ┌────┼──────────┬──────────────┐
   │    │           │              │
   RAG  Document   Action     Language
   │    Pipeline   Generator  Layer
   │    │
   Embed + Chroma (local vector DB)
        │
   Retrieved chunks → LLM (Claude) → Evidence Checker → Response
```

**Core principle:** Trust → Evidence → Explanation → Action. Every answer shows *what was found → where it came from → what it means → what to do next.*

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + React + Tailwind CSS |
| Backend | Python 3.11+ + FastAPI |
| Vector DB | ChromaDB (local, embedded) |
| LLM | Claude (Anthropic API) |
| Embeddings | `sentence-transformers` — `paraphrase-multilingual-mpnet-base-v2` |
| PDF / OCR | PyMuPDF + pytesseract |
| DB | SQLite via SQLAlchemy |

---

## Project Structure

```
ip-sakti-sahayak/
├── frontend/          # Next.js app
├── backend/           # FastAPI service
│   ├── app/
│   │   ├── routers/   # chat, upload, document, sources, feedback
│   │   ├── services/  # rag, llm, embeddings, vector_store, confidence, language, document_intel
│   │   ├── models/    # Pydantic schemas + SQLAlchemy ORM
│   │   └── core/      # config, database
│   ├── scripts/
│   │   └── ingest.py  # offline KB ingestion
│   └── data/
│       └── pdfs/      # place curated PDFs here
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in your keys
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Ingest Knowledge Base

```bash
# Place your PDFs in backend/data/pdfs/
# Then:
cd backend
python scripts/ingest.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Ask a question (grounded RAG) |
| `POST` | `/api/upload` | Upload a PDF document |
| `POST` | `/api/document/analyze` | Analyze an uploaded document |
| `GET` | `/api/sources` | List KB sources |
| `POST` | `/api/feedback` | Submit thumbs up/down |
| `POST` | `/api/profile` | Create a Digital Twin business profile |
| `PUT` | `/api/profile/{id}` | Update a profile |
| `GET` | `/api/profile/{id}/passport` | Generate the Compliance Passport |
| `POST` | `/api/tk-risk/assess` | Traditional Knowledge sensitivity assessment |
| `GET` | `/api/regulations` | List all seeded regulatory notifications |
| `GET` | `/api/regulations/impact?profile_id=` | Personalized regulation impact briefs |
| `GET` | `/api/calendar?profile_id=` | List compliance calendar events |
| `POST` | `/api/calendar/event` | Add a calendar event |
| `PATCH` | `/api/calendar/event/{id}/status` | Mark event done/overdue |
| `POST` | `/api/expert-brief` | Generate a downloadable Markdown expert brief |

## New MVP Features (this build)

1. **Digital Twin & Compliance Passport** (`/twin`) — persistent business profile → rule-based
   generated IP protection pathways, AYUSH obligations, and a priority-tagged checklist.
2. **Traditional Knowledge Risk Indicator** (`/tk-risk`) — heuristic Section 3(p) sensitivity
   scoring for AYUSH formulations (known-TK ingredient matching + novelty-signal detection).
3. **Regulation Change Impact Engine** (`/regulations`) — seeded IP India / AYUSH notifications
   matched against your profile with "why this applies to you" + required actions.
4. **Compliance Calendar** (`/calendar`) — add/track filing deadlines, renewals, audits, hearings.
5. **Expert Review Brief** (`/expert-brief`) — one-click downloadable Markdown case brief combining
   profile + chat + document analysis, ready to hand to an attorney/consultant.

All of the above are rule-based (no LLM call needed), so they work even before Ollama is running.

## Free Tech Stack Only

Everything here runs with **zero paid services**:
- **LLM:** [Ollama](https://ollama.com) running a local open model (default `llama3.2`) — `ollama pull llama3.2 && ollama serve`. Anthropic is an optional fallback only if you set `LLM_PROVIDER=anthropic` and provide a key.
- **Embeddings:** local ONNX models via `fastembed` (`BAAI/bge-small-en-v1.5`) — no API calls.
- **Vector store:** FAISS (local, in-process).
- **Database:** SQLite (local file).
- **Frontend:** Vite + React + Tailwind — static build, no hosted services required.

---

## Environment Variables

See `backend/.env.example` for the full list.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `CHROMA_PERSIST_DIR` | No | Path for Chroma DB (default: `./data/chroma_db`) |
| `DATABASE_URL` | No | SQLite URL (default: `sqlite+aiosqlite:///./ip_sakti.db`) |
| `EMBED_MODEL` | No | Sentence-transformers model name |
| `ALLOWED_ORIGINS` | No | CORS origins for frontend |

---

## Three Demo Journeys

1. **Multilingual RAG (Tamil):** Ask in Tamil about patenting an Ayurvedic formulation → grounded answer in Tamil + source cards + HIGH confidence badge.
2. **Document Intelligence:** Upload an examination notice PDF → extracted deadline + plain-language summary + compliance checklist.
3. **Actionable Compliance:** Ask how to protect an AYUSH startup's brand → trademark process + required documents + step list.

---

## Disclaimer

IP-SAKTI Sahayak provides informational guidance based on referenced official sources. It is not a substitute for professional legal advice or official government decisions. Please verify deadlines and legal conclusions against the latest official source.
