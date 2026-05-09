import os
import json
import time

from groq import Groq

from backend.services.retriever import hybrid_retrieve

# ─────────────────────────────────────────────
# INIT GROQ
# ─────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY missing")

client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = "llama-3.3-70b-versatile"

# ─────────────────────────────────────────────
# BUILD CONTEXT
# ─────────────────────────────────────────────
def build_context(docs):

    context_parts = []

    for i, d in enumerate(docs):

        metadata = d.get("metadata", {})

        source = metadata.get("source", "Unknown")

        page = metadata.get("page", 1)

        section = metadata.get("section", "GENERAL")

        content = d.get("content", "").strip()

        if not content:
            continue

        context_parts.append(
            f"""
SOURCE {i+1}
Document: {source}
Page: {page}
Section: {section}

CONTENT:
{content}
"""
        )

    return "\n\n".join(context_parts)

# ─────────────────────────────────────────────
# FORMAT SOURCES
# ─────────────────────────────────────────────
def format_sources(docs):

    formatted_sources = []

    for idx, d in enumerate(docs):

        metadata = d.get("metadata", {})

        formatted_sources.append({
            "id": str(idx + 1),
            "documentId": metadata.get("source", "Unknown"),
            "documentTitle": metadata.get("source", "Unknown"),
            "content": d.get("content", ""),
            "pageNumber": metadata.get("page", 1),
            "section": metadata.get("section", "GENERAL"),
            "similarityScore": round(
                metadata.get("dense_score", 0),
                5
            ),
            "rerankScore": round(
                metadata.get("rerank_score", 0),
                5
            ),
            "chunkType": "standalone",
            "metadata": {
                "source": metadata.get("source", "Unknown"),
                "section": metadata.get("section", "GENERAL")
            },
            "citations": [
                {
                    "id": f"cite-{idx+1}",
                    "text": metadata.get("source", "Unknown"),
                    "location": f"Page {metadata.get('page', 1)}",
                    "confidence": round(
                        metadata.get("rerank_score", 0.9),
                        3
                    )
                }
            ]
        })

    return formatted_sources

# ─────────────────────────────────────────────
# QUERY ANALYSIS
# ─────────────────────────────────────────────
def build_query_analysis(query: str):

    return {
        "intent": "document_question_answering",
        "entities": [],
        "filters": {},
        "expandedQueries": [
            query
        ],
        "retrievalStrategy": "hybrid_rerank"
    }

# ─────────────────────────────────────────────
# NON-STREAMING PIPELINE
# ─────────────────────────────────────────────
def run_rag_pipeline(query: str):

    total_start = time.time()

    # ─────────────────────────────────────────
    # RETRIEVAL
    # ─────────────────────────────────────────
    retrieval_result = hybrid_retrieve(query)

    docs = retrieval_result["documents"]

    retrieval_debug = retrieval_result["retrieval_debug"]

    retrieval_latency = retrieval_result["latency"]

    # ─────────────────────────────────────────
    # CONTEXT
    # ─────────────────────────────────────────
    context = build_context(docs)

    # ─────────────────────────────────────────
    # PROMPT
    # ─────────────────────────────────────────
    prompt = f"""
You are a senior FP&A analyst.

Answer ONLY using the provided context.

RULES:
1. Use ONLY the provided context.
2. Do NOT hallucinate.
3. If information is missing, say:
   "I could not find that information in the documents."
4. Be concise and analytical.
5. Prefer bullet points when useful.

CONTEXT:
{context}

QUESTION:
{query}
"""

    generation_start = time.time()

    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    answer = response.choices[0].message.content.strip()

    generation_latency = round(
        (time.time() - generation_start) * 1000,
        2
    )

    total_latency = round(
        (time.time() - total_start) * 1000,
        2
    )

    return {
        "answer": answer,

        "sources": format_sources(docs),

        "queryAnalysis": build_query_analysis(query),

        "retrievalDebug": {
            "hybridSearchUsed": True,
            "bm25Hits": len(
                retrieval_debug.get(
                    "bm25_results",
                    []
                )
            ),
            "denseHits": len(
                retrieval_debug.get(
                    "vector_results",
                    []
                )
            ),
            "rerankingApplied": True,
            "contextCompressed": False,
            "totalChunksRetrieved": len(
                retrieval_debug.get(
                    "vector_results",
                    []
                )
            ),
            "finalChunksUsed": len(docs),
            "retrievalTimeMs": retrieval_latency.get(
                "retrieval_total_ms",
                0
            ),
            "embeddingModel": "embed-english-v3.0",
            "rerankModel": "rerank-english-v3.0"
        },

        "latencyMs": total_latency,

        "tokensUsed": len(answer.split()),

        "confidenceScore": 0.93
    }

# ─────────────────────────────────────────────
# STREAMING PIPELINE
# ─────────────────────────────────────────────
def stream_rag_pipeline(query: str):

    total_start = time.time()

    # ─────────────────────────────────────────
    # RETRIEVAL
    # ─────────────────────────────────────────
    retrieval_result = hybrid_retrieve(query)

    docs = retrieval_result["documents"]

    retrieval_debug = retrieval_result["retrieval_debug"]

    retrieval_latency = retrieval_result["latency"]

    # ─────────────────────────────────────────
    # CONTEXT
    # ─────────────────────────────────────────
    context = build_context(docs)

    # ─────────────────────────────────────────
    # PROMPT
    # ─────────────────────────────────────────
    prompt = f"""
You are a senior FP&A analyst.

Answer ONLY using the provided context.

RULES:
1. Use ONLY the provided context.
2. Do NOT hallucinate.
3. If information is missing, say:
   "I could not find that information in the documents."
4. Be concise and analytical.
5. Prefer bullet points when useful.

CONTEXT:
{context}

QUESTION:
{query}
"""

    generation_start = time.time()

    stream = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        stream=True,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    full_answer = ""

    # ─────────────────────────────────────────
    # TOKEN STREAMING
    # ─────────────────────────────────────────
    for chunk in stream:

        delta = chunk.choices[0].delta.content

        if not delta:
            continue

        full_answer += delta

        payload = {
            "type": "token",
            "content": delta
        }

        yield f"data: {json.dumps(payload)}\n\n"

    generation_latency = round(
        (time.time() - generation_start) * 1000,
        2
    )

    total_latency = round(
        (time.time() - total_start) * 1000,
        2
    )

    # ─────────────────────────────────────────
    # FINAL METADATA EVENT
    # ─────────────────────────────────────────
    meta_payload = {
        "type": "meta",
        "meta": {
            "sources": format_sources(docs),

            "queryAnalysis": build_query_analysis(query),

            "retrievalDebug": {
                "hybridSearchUsed": True,
                "bm25Hits": len(
                    retrieval_debug.get(
                        "bm25_results",
                        []
                    )
                ),
                "denseHits": len(
                    retrieval_debug.get(
                        "vector_results",
                        []
                    )
                ),
                "rerankingApplied": True,
                "contextCompressed": False,
                "totalChunksRetrieved": len(
                    retrieval_debug.get(
                        "vector_results",
                        []
                    )
                ),
                "finalChunksUsed": len(docs),
                "retrievalTimeMs": retrieval_latency.get(
                    "retrieval_total_ms",
                    0
                ),
                "embeddingModel": "embed-english-v3.0",
                "rerankModel": "rerank-english-v3.0"
            },

            "latencyMs": total_latency,

            "tokensUsed": len(full_answer.split()),

            "confidenceScore": 0.93
        }
    }

    yield f"data: {json.dumps(meta_payload)}\n\n"

    # ─────────────────────────────────────────
    # STREAM COMPLETE
    # ─────────────────────────────────────────
    yield "data: [DONE]\n\n"