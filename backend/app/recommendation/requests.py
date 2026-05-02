from __future__ import annotations

import traceback

from fastapi import HTTPException

from ..config import Settings
from ..contracts.models import SlotRecommendationRequest, SlotRecommendationsResponse
from ..optcg_client import OptcgClient
from ..shared.ai_support import RedisBackedState
from .service import SlotRecommendationService


class SlotRecommendationRequestService:
    def __init__(
        self,
        settings: Settings,
        client: OptcgClient,
        redis_state: RedisBackedState,
        recommendation_service: SlotRecommendationService,
    ) -> None:
        self._settings = settings
        self._client = client
        self._redis_state = redis_state
        self._recommendation_service = recommendation_service

    async def handle(
        self,
        subject: str,
        payload: SlotRecommendationRequest,
    ) -> SlotRecommendationsResponse:
        decision = await self._redis_state.increment_windowed_counter(
            "ratelimit:ai",
            subject,
            self._settings.ai_rate_limit_per_minute,
            self._settings.ai_rate_limit_per_hour,
        )
        if not decision.allowed:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        if payload.templateId == "1x1":
            return SlotRecommendationsResponse(recommendations=[], cached=False)
        if any(placement.slotId == payload.selectedSlotId for placement in payload.placements):
            return SlotRecommendationsResponse(recommendations=[], cached=False)

        try:
            cache_key = self._recommendation_service.build_cache_key(payload)
            cached = await self._redis_state.get_json(cache_key)
            if cached is not None:
                return SlotRecommendationsResponse.model_validate({**cached, "cached": True})

            all_cards = await self._client.fetch_all_set_cards()
            recommendations = await self._recommendation_service.recommend(payload, all_cards)
            response_payload = SlotRecommendationsResponse(
                recommendations=recommendations,
                cached=False,
            )
            await self._redis_state.set_json(
                cache_key,
                {"recommendations": [item.model_dump() for item in recommendations]},
                self._settings.ai_cache_ttl_seconds,
            )
            return response_payload
        except HTTPException:
            raise
        except Exception as error:
            traceback.print_exc()
            raise HTTPException(
                status_code=502,
                detail="Could not load slot recommendations",
            ) from error
