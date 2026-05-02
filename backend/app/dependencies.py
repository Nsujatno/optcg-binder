from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from .ai_support import RedisBackedState
from .config import Settings, get_settings
from .optcg_client import OptcgClient
from .slot_recommendations import SlotRecommendationService


@dataclass(frozen=True)
class BackendDependencies:
    settings: Settings
    client: OptcgClient
    redis_state: RedisBackedState
    recommendation_service: SlotRecommendationService
    allowed_card_image_hosts: frozenset[str]


@lru_cache(maxsize=1)
def get_backend_dependencies() -> BackendDependencies:
    settings = get_settings()
    redis_state = RedisBackedState(settings)
    if not redis_state.enabled:
        raise RuntimeError(
            "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured before starting the backend."
        )

    print("AI rate limit store:", "upstash")

    return BackendDependencies(
        settings=settings,
        client=OptcgClient(settings.optcg_api_base),
        redis_state=redis_state,
        recommendation_service=SlotRecommendationService(settings),
        allowed_card_image_hosts=frozenset(
            {
                "www.optcgapi.com",
                "optcgapi.com",
            }
        ),
    )
