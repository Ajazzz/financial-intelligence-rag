import os
from groq import Groq


def generate_answer(query: str, docs: list):
    """
    Generate answer strictly from retrieved documents.
    """

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")

    client = Groq(api_key=api_key)

    # ─────────────────────────────────────────────
    # Clean + limit context (improved)
    # ─────────────────────────────────────────────
    docs = docs[:8]  # 🔥 increased from 5 → better coverage

    context_chunks = []
    for d in docs:
        content = d.get("content") or d.get("text") or ""
        content = content.strip()
        if content:
            context_chunks.append(content)

    context = "\n\n".join(context_chunks)

    # 🔍 DEBUG: Inspect retrieved context
    print("\n--- RETRIEVED CONTEXT ---\n")
    print(context[:1000])  # first 1000 chars
    print("\n-------------------------\n")

    # ─────────────────────────────────────────────
    # HARD GUARD: No context → no answer
    # ─────────────────────────────────────────────
    if not context:
        return "The information is not available in the provided documents."

    # ─────────────────────────────────────────────
    # SYSTEM PROMPT (Balanced — allows synthesis)
    # ─────────────────────────────────────────────
    system_prompt = """
You are an FP&A financial analyst assistant.

RULES:
1. Use ONLY the provided context as your primary source.
2. You MAY summarize, combine, and interpret information from the context.
3. DO NOT introduce facts that are not supported by the context.
4. If the answer is partially available, provide the available information clearly.
5. If the answer is completely missing, respond:
   "The information is not available in the provided documents."
6. Prefer structured output (bullets, tables) when useful.

Be precise, grounded, and analytical.
"""

    user_prompt = f"""
CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    # ─────────────────────────────────────────────
    # LLM CALL
    # ─────────────────────────────────────────────
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    answer = response.choices[0].message.content.strip()

    # ─────────────────────────────────────────────
    # FINAL GUARDRAILS (cleaned)
    # ─────────────────────────────────────────────
    if not answer:
        return "The information is not available in the provided documents."

    if "not available" in answer.lower():
        return "The information is not available in the provided documents."

    return answer