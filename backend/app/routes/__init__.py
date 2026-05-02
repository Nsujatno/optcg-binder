from .card_image import router as card_image_router
from .catalog import router as catalog_router
from .health import router as health_router
from .recommendations import router as recommendations_router

__all__ = [
    "card_image_router",
    "catalog_router",
    "health_router",
    "recommendations_router",
]
