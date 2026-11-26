from contextlib import asynccontextmanager
from pathlib import Path
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .api import router
from . import rag


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("medic_ai.main")


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(engine)


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting Medic.AI...")

    # Absolute path to the medical knowledge folder
    backend_dir = Path(__file__).resolve().parent.parent

    knowledge_dir = backend_dir / "data" / "knowledge"

    try:

        if not knowledge_dir.exists():
            logger.warning(
                "Medical knowledge folder not found: %s",
                knowledge_dir
            )

        else:

            total_chunks = rag.ingest(
                folder=str(knowledge_dir)
            )

            logger.info(
                "Medical knowledge ingestion completed. "
                "Chunks processed: %d",
                total_chunks
            )

    except Exception as error:

        logger.exception(
            "Medical knowledge ingestion failed: %s",
            error
        )

    yield

    logger.info("Shutting down Medic.AI...")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Medic.AI",
    description="AI-Powered Healthcare Intelligence & Patient Support System",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "application": "Medic.AI"
    }