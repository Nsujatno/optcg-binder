from __future__ import annotations

import traceback

from fastapi import APIRouter, Depends, HTTPException, Request

from ..ai_support import resolve_rate_limit_subject
from ..dependencies import BackendDependencies, get_backend_dependencies
from ..models import SlotRecommendationRequest, SlotRecommendationsResponse


router = APIRouter(prefix="/api/ai")


@router.post("/slot-recommendations", response_model=SlotRecommendationsResponse)
async def get_slot_recommendations(
    request: Request,
    payload: SlotRecommendationRequest,
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> SlotRecommendationsResponse:
    subject = resolve_rate_limit_subject(
        request.headers.get("x-forwarded-for"),
        request.client.host if request.client else None,
    )
    decision = await dependencies.redis_state.increment_windowed_counter(
        "ratelimit:ai",
        subject,
        dependencies.settings.ai_rate_limit_per_minute,
        dependencies.settings.ai_rate_limit_per_hour,
    )
    if not decision.allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    if payload.templateId == "1x1":
        return SlotRecommendationsResponse(recommendations=[], cached=False)
    if any(placement.slotId == payload.selectedSlotId for placement in payload.placements):
        return SlotRecommendationsResponse(recommendations=[], cached=False)

    try:
        cache_key = dependencies.recommendation_service.build_cache_key(payload)
        cached = await dependencies.redis_state.get_json(cache_key)
        if cached is not None:
            return SlotRecommendationsResponse.model_validate({**cached, "cached": True})

        all_cards = await dependencies.client.fetch_all_set_cards()
        recommendations = await dependencies.recommendation_service.recommend(
            payload,
            all_cards,
        )
        response_payload = SlotRecommendationsResponse(
            recommendations=recommendations,
            cached=False,
        )
        await dependencies.redis_state.set_json(
            cache_key,
            {"recommendations": [item.model_dump() for item in recommendations]},
            dependencies.settings.ai_cache_ttl_seconds,
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
