# Contract Intelligence AI

Enterprise frontend for a production-grade Advanced RAG (Retrieval-Augmented Generation) system.

## Features

- **Hybrid Retrieval** — BM25 + Dense vector search with Cohere reranking
- **Source Inspector** — View retrieved chunks, similarity scores, rerank scores, and citation tracing
- **Query Analysis** — Inspect intent detection, entity extraction, metadata filters, and multi-query expansion
- **Retrieval Debug** — Full pipeline transparency: chunk counts, compression ratios, model info
- **Streaming Responses** — Real-time SSE streaming from the FastAPI backend
- **Session Memory** — Conversation history with Upstash Redis backend
- **Collapsible Panels** — Sidebar and Source Inspector collapse for focus mode

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Lucide Icons

## Setup — Windows (Local)

```bash
# 1. Install Node.js 20+ from https://nodejs.org

# 2. Clone / extract this folder, then:
cd contract-intelligence-ai

# 3. Install dependencies
npm install

# 4. Configure environment
copy .env.example .env
# Edit .env and set VITE_API_URL to your FastAPI backend URL

# 5. Run dev server
npm run dev
```

Open http://localhost:5173 in your browser.

## Setup — macOS / Linux

```bash
cd contract-intelligence-ai
npm install
cp .env.example .env
# Edit .env
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend | `http://localhost:8000` |

## Expected Backend Endpoints

The frontend calls these FastAPI endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat/stream` | POST | SSE streaming chat response |
| `/api/chat` | POST | Non-streaming chat response |
| `/api/conversations` | GET | List conversation history |
| `/api/conversations/:id` | DELETE | Delete a conversation |
| `/api/rag/status` | GET | Backend/model connection status |
| `/api/rag/collections` | GET | Available document collections |

### SSE Stream Format (`/api/chat/stream`)

```
data: {"type": "token", "content": "Escalation"}
data: {"type": "token", "content": " clauses"}
data: {"type": "meta", "meta": { ...ChatResponse fields minus answer... }}
data: [DONE]
```

## Deployment — Render

1. Push this folder to a GitHub repository
2. Go to [render.com](https://render.com) → **New Static Site**
3. Connect your repo
4. Configure:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
5. Add environment variable: `VITE_API_URL` → your FastAPI backend URL
6. Deploy

## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx       # Center chat area + empty state
│   │   ├── ChatInput.tsx       # Multiline input with streaming controls
│   │   └── MessageBubble.tsx   # User/assistant message rendering
│   ├── sidebar/
│   │   └── Sidebar.tsx         # Left nav: sessions, retrieval mode, collections, status
│   ├── inspector/
│   │   ├── SourceInspector.tsx # Right panel shell with tabs
│   │   ├── SourceCard.tsx      # Individual retrieved chunk card
│   │   ├── RetrievalDebugPanel.tsx  # Pipeline debug view
│   │   └── QueryAnalysisPanel.tsx   # Intent/entity/filter analysis
│   └── ui/
│       ├── Badge.tsx
│       ├── ScoreBar.tsx
│       ├── Skeleton.tsx
│       └── StatusDot.tsx
├── hooks/
│   ├── useChat.ts              # SSE streaming, message state
│   ├── useConversations.ts     # Session management
│   └── useRagStatus.ts         # Backend status + collection list
├── services/
│   ├── api.ts                  # Fetch wrapper with error handling
│   ├── chat.ts                 # Chat + conversation endpoints
│   └── rag.ts                  # RAG status + collection endpoints
├── types/
│   └── index.ts                # All TypeScript types
├── App.tsx
├── main.tsx
└── index.css
```
