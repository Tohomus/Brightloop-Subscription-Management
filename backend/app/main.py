from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_db_and_tables
from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.plans import router as plans_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Executes on application startup:
    Initializes all SQLite database tables automatically.
    """
    create_db_and_tables()
    yield


app = FastAPI(
    title="Brightloop Subscription Management API",
    description="Unified recurring billing, subscription lifecycle, and revenue engine.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for local frontend (Vite port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(plans_router)


@app.get("/health", tags=["Health"])
def health_check():
    """System health verification endpoint."""
    return {
        "status": "healthy",
        "service": "Brightloop Subscription Management API",
        "version": "1.0.0"
    }
