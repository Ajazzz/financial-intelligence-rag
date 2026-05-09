import os
import re
import fitz
import cohere
import time
import uuid

from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

# ─────────────────────────────────────────────
# LOAD ENV
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_PATH = os.path.join(BASE_DIR, "..", ".env")

DATA_DIR = os.path.join(BASE_DIR, "data")

load_dotenv(ENV_PATH)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("INDEX_NAME")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY missing")

if not INDEX_NAME:
    raise ValueError("INDEX_NAME missing")

if not COHERE_API_KEY:
    raise ValueError("COHERE_API_KEY missing")

# ─────────────────────────────────────────────
# INIT CLIENTS
# ─────────────────────────────────────────────
co = cohere.Client(COHERE_API_KEY)

pc = Pinecone(api_key=PINECONE_API_KEY)

# ─────────────────────────────────────────────
# CREATE / CONNECT INDEX
# ─────────────────────────────────────────────
existing_indexes = [i.name for i in pc.list_indexes()]

if INDEX_NAME not in existing_indexes:

    print(f"Creating index: {INDEX_NAME}")

    pc.create_index(
        name=INDEX_NAME,
        dimension=1024,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )

else:
    print(f"Using existing index: {INDEX_NAME}")

index = pc.Index(INDEX_NAME)

# ─────────────────────────────────────────────
# EXTRACT METADATA FROM FILENAME
# ─────────────────────────────────────────────
def extract_document_metadata(filename):

    metadata = {
        "company": "NVIDIA",
        "document_type": "unknown",
        "fiscal_year": "unknown",
        "source": filename
    }

    upper_name = filename.upper()

    # DOCUMENT TYPE
    if "10K" in upper_name:
        metadata["document_type"] = "10K"

    elif "TRANSCRIPT" in upper_name:
        metadata["document_type"] = "earnings_call"

    # FISCAL YEAR
    fy_match = re.search(r"FY(\d{4})", upper_name)

    if fy_match:
        metadata["fiscal_year"] = fy_match.group(0)

    return metadata

# ─────────────────────────────────────────────
# PDF EXTRACTION
# ─────────────────────────────────────────────
def extract_pages(pdf_path):

    doc = fitz.open(pdf_path)

    pages = []

    for page_num, page in enumerate(doc):

        text = page.get_text()

        if text.strip():

            pages.append({
                "page": page_num + 1,
                "text": text
            })

    return pages

# ─────────────────────────────────────────────
# FINANCIAL SECTION SPLITTING
# ─────────────────────────────────────────────
SECTION_PATTERN = r"(ITEM\s+\d+[A-Z]?\.?)"

def split_financial_sections(text):

    parts = re.split(
        SECTION_PATTERN,
        text,
        flags=re.IGNORECASE
    )

    sections = []

    current_title = "GENERAL"

    current_text = ""

    for part in parts:

        part = part.strip()

        if not part:
            continue

        if re.match(SECTION_PATTERN, part, re.IGNORECASE):

            if current_text:

                sections.append({
                    "section": current_title,
                    "text": current_text.strip()
                })

            current_title = part
            current_text = ""

        else:
            current_text += "\n" + part

    if current_text:

        sections.append({
            "section": current_title,
            "text": current_text.strip()
        })

    return sections

# ─────────────────────────────────────────────
# RECURSIVE CHUNKING
# ─────────────────────────────────────────────
def recursive_chunk(
    text,
    chunk_size=350,
    overlap=60
):

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(words[start:end])

        chunks.append(chunk)

        start += (chunk_size - overlap)

    return chunks

# ─────────────────────────────────────────────
# CREATE CHUNKS
# ─────────────────────────────────────────────
def create_chunks(pages):

    final_chunks = []

    for page_data in pages:

        page_num = page_data["page"]

        text = page_data["text"]

        sections = split_financial_sections(text)

        for sec in sections:

            section_name = sec["section"]

            section_text = sec["text"]

            if len(section_text.split()) <= 350:

                final_chunks.append({
                    "page": page_num,
                    "section": section_name,
                    "text": section_text
                })

            else:

                sub_chunks = recursive_chunk(section_text)

                for sub in sub_chunks:

                    final_chunks.append({
                        "page": page_num,
                        "section": section_name,
                        "text": sub
                    })

    return final_chunks

# ─────────────────────────────────────────────
# COHERE EMBEDDINGS
# ─────────────────────────────────────────────
def embed_batch(texts):

    retries = 5

    for attempt in range(retries):

        try:

            response = co.embed(
                texts=texts,
                model="embed-english-v3.0",
                input_type="search_document",
                embedding_types=["float"]
            )

            return response.embeddings.float

        except Exception as e:

            print(f"Embedding error: {e}")

            wait_time = (attempt + 1) * 10

            print(f"Retrying in {wait_time} sec...")

            time.sleep(wait_time)

    raise Exception("Failed after retries")

# ─────────────────────────────────────────────
# INDEX SINGLE PDF
# ─────────────────────────────────────────────
def index_pdf(pdf_path):

    filename = os.path.basename(pdf_path)

    print(f"\n📄 Processing: {filename}")

    doc_metadata = extract_document_metadata(filename)

    print(f"Metadata: {doc_metadata}")

    print("Extracting PDF pages...")

    pages = extract_pages(pdf_path)

    print("Creating semantic chunks...")

    chunks = create_chunks(pages)

    print(f"Total chunks: {len(chunks)}")

    batch_size = 4

    for i in range(0, len(chunks), batch_size):

        batch = chunks[i:i + batch_size]

        texts = [b["text"] for b in batch]

        embeddings = embed_batch(texts)

        vectors = []

        for j, embedding in enumerate(embeddings):

            chunk_data = batch[j]

            vectors.append({
                "id": str(uuid.uuid4()),
                "values": embedding,
                "metadata": {
                    "text": chunk_data["text"],
                    "source": doc_metadata["source"],
                    "company": doc_metadata["company"],
                    "document_type": doc_metadata["document_type"],
                    "fiscal_year": doc_metadata["fiscal_year"],
                    "page": chunk_data["page"],
                    "section": chunk_data["section"]
                }
            })

        index.upsert(vectors=vectors)

        print(
            f"Uploaded batch "
            f"{i // batch_size + 1}"
        )

        time.sleep(8)

    print(f"✅ Finished indexing: {filename}")

# ─────────────────────────────────────────────
# INDEX ALL PDFs
# ─────────────────────────────────────────────
def index_all_pdfs():

    if not os.path.exists(DATA_DIR):

        raise FileNotFoundError(
            f"Data folder missing: {DATA_DIR}"
        )

    pdf_files = [
        f for f in os.listdir(DATA_DIR)
        if f.lower().endswith(".pdf")
    ]

    if not pdf_files:

        raise FileNotFoundError(
            "No PDF files found in data folder"
        )

    print(f"\nFound {len(pdf_files)} PDF files")

    for pdf_file in pdf_files:

        pdf_path = os.path.join(DATA_DIR, pdf_file)

        index_pdf(pdf_path)

    print("\n🎉 ALL DOCUMENTS INDEXED")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":

    index_all_pdfs()