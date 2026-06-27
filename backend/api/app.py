"""FastAPI application for PRISM backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from .routes import analytics, candidates, compare, pipeline, submission

# Create FastAPI app
app = FastAPI(
    title="PRISM API",
    description="REST API for PRISM candidate ranking and analysis system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(analytics.router)
app.include_router(candidates.router)
app.include_router(compare.router)
app.include_router(pipeline.router)
app.include_router(submission.router)


@app.get("/", tags=["root"])
async def root():
    """Welcome message."""
    return {
        "message": "PRISM API",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs",
        "endpoints": {
            "analytics": {
                "overview": "GET /api/analytics/overview"
            },
            "candidates": {
                "list": "GET /api/candidates?page=1&limit=20",
                "detail": "GET /api/candidates/{candidate_id}",
            },
            "compare": {
                "compare": "GET /api/compare?id1=CAND_X&id2=CAND_Y"
            },
            "pipeline": {
                "status": "GET /api/pipeline"
            },
            "submission": {
                "top100": "GET /api/submission/top100"
            }
        }
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


def custom_openapi():
    """Customize OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="PRISM API",
        version="1.0.0",
        description="REST API for PRISM candidate ranking and analysis system",
        routes=app.routes,
    )
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
