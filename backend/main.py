import os

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# ─────────────────────────────────────────────
# LOAD ENV
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH)

print("INDEX_NAME:", os.getenv("INDEX_NAME"))

# ─────────────────────────────────────────────
# FASTAPI INIT
# ─────────────────────────────────────────────
app = FastAPI(
    title="FP&A RAG API",
    version="1.0.0"
)

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
from backend.routes.query import router as query_router

app.include_router(
    query_router,
    prefix="/api"
)

# ─────────────────────────────────────────────
# STATIC FRONTEND
# ─────────────────────────────────────────────
STATIC_DIR = os.path.join(BASE_DIR, "static")

ASSETS_DIR = os.path.join(STATIC_DIR, "assets")

# Mount React assets
if os.path.exists(ASSETS_DIR):

    app.mount(
        "/assets",
        StaticFiles(directory=ASSETS_DIR),
        name="assets"
    )

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health")

async def health_check():

    return {
        "status": "healthy"
    }

# ─────────────────────────────────────────────
# FRONTEND SERVING
# ─────────────────────────────────────────────
@app.get("/{full_path:path}")

async def serve_frontend(full_path: str):

    index_path = os.path.join(STATIC_DIR, "index.html")

    if os.path.exists(index_path):

        return FileResponse(index_path)

    return JSONResponse(
        status_code=404,
        content={
            "error": "Frontend build not found"
        }
    )