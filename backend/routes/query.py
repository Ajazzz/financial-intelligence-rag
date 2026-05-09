from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from backend.rag.pipeline import (
    run_rag_pipeline,
    stream_rag_pipeline
)

# ─────────────────────────────────────────────
# ROUTER
# ─────────────────────────────────────────────
router = APIRouter()

# ─────────────────────────────────────────────
# REQUEST MODEL
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):

    query: str

    conversationId: Optional[str] = None

    retrievalMode: Optional[str] = "hybrid"

    collectionIds: Optional[List[str]] = []

# ─────────────────────────────────────────────
# STANDARD CHAT ENDPOINT
# ─────────────────────────────────────────────
@router.post("/chat")

async def chat_endpoint(req: ChatRequest):

    try:

        query = req.query.strip()

        if not query:

            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )

        print(f"\n🔍 CHAT QUERY: {query}")

        result = run_rag_pipeline(query)

        if not result:

            raise HTTPException(
                status_code=500,
                detail="Pipeline returned empty response"
            )

        return result

    except HTTPException:
        raise

    except Exception as e:

        print(f"\n❌ CHAT ERROR: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Internal backend error"
        )

# ─────────────────────────────────────────────
# STREAMING CHAT ENDPOINT
# ─────────────────────────────────────────────
@router.post("/chat/stream")

async def stream_chat_endpoint(req: ChatRequest):

    try:

        query = req.query.strip()

        if not query:

            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )

        print(f"\n⚡ STREAM QUERY: {query}")

        return StreamingResponse(
            stream_rag_pipeline(query),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        print(f"\n❌ STREAM ERROR: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Streaming backend error"
        )

# ─────────────────────────────────────────────
# LEGACY QUERY ENDPOINT
# (Backward compatibility)
# ─────────────────────────────────────────────
@router.post("/query")

async def legacy_query_endpoint(req: ChatRequest):

    return await chat_endpoint(req)