from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_backend_dependencies
from .routes import (
    card_image_router,
    catalog_router,
    health_router,
    recommendations_router,
)


def create_app() -> FastAPI:
    dependencies = get_backend_dependencies()
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[dependencies.settings.frontend_origin],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    app.include_router(catalog_router)
    app.include_router(recommendations_router)
    app.include_router(card_image_router)
    return app


app = create_app()
