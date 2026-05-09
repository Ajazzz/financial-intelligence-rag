import os
import time
import cohere
import numpy as np

from pinecone import Pinecone
from rank_bm25 import BM25Okapi

# ─────────────────────────────────────────────
# INIT CLIENTS
# ─────────────────────────────────────────────
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

if not COHERE_API_KEY:
    raise ValueError("COHERE_API_KEY missing")

co = cohere.Client(COHERE_API_KEY)

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

index_name = os.getenv("INDEX_NAME")

index = pc.Index(index_name)

# ─────────────────────────────────────────────
# EMBEDDING
# ─────────────────────────────────────────────
def embed_query(query: str):

    response = co.embed(
        texts=[query],
        model="embed-english-v3.0",
        input_type="search_query",
        embedding_types=["float"]
    )

    return response.embeddings.float[0]

# ─────────────────────────────────────────────
# VECTOR SEARCH
# ─────────────────────────────────────────────
def vector_search(query, top_k=15):

    start_time = time.time()

    query_embedding = embed_query(query)

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    docs = []

    for match in results.get("matches", []):

        metadata = match.get("metadata", {}) or {}

        docs.append({
            "content": metadata.get("text", ""),
            "metadata": {
                "source": metadata.get("source", "Unknown"),
                "page": metadata.get("page", 1),
                "section": metadata.get("section", "GENERAL"),
                "dense_score": float(match.get("score", 0))
            }
        })

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return docs, latency_ms

# ─────────────────────────────────────────────
# BM25 SEARCH
# ─────────────────────────────────────────────
def bm25_search(query, vector_docs, top_k=10):

    start_time = time.time()

    corpus = [doc["content"] for doc in vector_docs]

    tokenized_corpus = [doc.split(" ") for doc in corpus]

    bm25 = BM25Okapi(tokenized_corpus)

    tokenized_query = query.split(" ")

    scores = bm25.get_scores(tokenized_query)

    ranked_indices = np.argsort(scores)[::-1][:top_k]

    bm25_docs = []

    for idx in ranked_indices:

        doc = vector_docs[idx]

        doc["metadata"]["bm25_score"] = float(scores[idx])

        bm25_docs.append(doc)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return bm25_docs, latency_ms

# ─────────────────────────────────────────────
# RERANK
# ─────────────────────────────────────────────
def rerank_documents(query, docs, top_k=7):

    start_time = time.time()

    documents = [d["content"] for d in docs]

    response = co.rerank(
        query=query,
        documents=documents,
        model="rerank-english-v3.0",
        top_n=top_k
    )

    reranked_docs = []

    for result in response.results:

        original_doc = docs[result.index]

        original_doc["metadata"]["rerank_score"] = float(
            result.relevance_score
        )

        reranked_docs.append(original_doc)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return reranked_docs, latency_ms

# ─────────────────────────────────────────────
# FORMAT DEBUG RESULTS
# ─────────────────────────────────────────────
def format_debug_results(docs, score_key):

    formatted = []

    for doc in docs:

        metadata = doc.get("metadata", {})

        formatted.append({
            "source": metadata.get("source", "Unknown"),
            "page": metadata.get("page", 1),
            "section": metadata.get("section", "GENERAL"),
            "score": round(
                metadata.get(score_key, 0),
                5
            ),
            "snippet": doc.get("content", "")[:300]
        })

    return formatted

# ─────────────────────────────────────────────
# HYBRID RETRIEVAL
# ─────────────────────────────────────────────
def hybrid_retrieve(query: str, top_k: int = 7):

    retrieval_start = time.time()

    # ─────────────────────────────────────────
    # STEP 1 — Dense Vector Retrieval
    # ─────────────────────────────────────────
    vector_docs, vector_latency = vector_search(
        query,
        top_k=20
    )

    # ─────────────────────────────────────────
    # STEP 2 — BM25 Retrieval
    # ─────────────────────────────────────────
    bm25_docs, bm25_latency = bm25_search(
        query,
        vector_docs,
        top_k=15
    )

    # ─────────────────────────────────────────
    # STEP 3 — Cohere Reranking
    # ─────────────────────────────────────────
    reranked_docs, rerank_latency = rerank_documents(
        query,
        bm25_docs,
        top_k=top_k
    )

    total_latency = round(
        (time.time() - retrieval_start) * 1000,
        2
    )

    # ─────────────────────────────────────────
    # RETRIEVAL DEBUG PAYLOAD
    # ─────────────────────────────────────────
    retrieval_debug = {
        "vector_results": format_debug_results(
            vector_docs,
            "dense_score"
        ),
        "bm25_results": format_debug_results(
            bm25_docs,
            "bm25_score"
        ),
        "reranked_results": format_debug_results(
            reranked_docs,
            "rerank_score"
        )
    }

    # ─────────────────────────────────────────
    # LATENCY METRICS
    # ─────────────────────────────────────────
    latency = {
        "vector_search_ms": vector_latency,
        "bm25_ms": bm25_latency,
        "rerank_ms": rerank_latency,
        "retrieval_total_ms": total_latency
    }

    return {
        "documents": reranked_docs,
        "retrieval_debug": retrieval_debug,
        "latency": latency
    }