from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from ..contracts.models import SlotRecommendationRequest, SlotRecommendationsResponse
from ..dependencies import BackendDependencies, get_backend_dependencies
from ..shared.ai_support import resolve_rate_limit_subject


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
    return await dependencies.recommendation_request_service.handle(subject, payload)
