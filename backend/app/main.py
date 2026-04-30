from __future__ import annotations

from urllib.parse import urlparse
import traceback

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import (
    CardsResponse,
    MarketPriceResponse,
    SetsResponse,
    SlotRecommendationRequest,
    SlotRecommendationsResponse,
)
from .ai_support import RedisBackedState, resolve_rate_limit_subject
from .optcg_client import OptcgClient
from .slot_recommendations import SlotRecommendationService


settings = get_settings()
client = OptcgClient(settings.optcg_api_base)
redis_state = RedisBackedState(settings)
if not redis_state.enabled:
    raise RuntimeError(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured before starting the backend."
    )
recommendation_service = SlotRecommendationService(settings)

print(
    "AI rate limit store:",
    "upstash",
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/api/sets", response_model=SetsResponse)
async def get_sets() -> SetsResponse:
    return SetsResponse(sets=await client.fetch_sets())


@app.get("/api/sets/{set_id}/cards", response_model=CardsResponse)
async def get_cards_by_set(set_id: str) -> CardsResponse:
    return CardsResponse(cards=await client.fetch_cards_by_set(set_id))


@app.get("/api/cards/search", response_model=CardsResponse)
async def search_cards(
    q: str = Query(default=""),
    setId: str | None = Query(default=None),
) -> CardsResponse:
    return CardsResponse(cards=await client.search_cards(q, setId))


@app.get("/api/cards/{card_id}/market", response_model=MarketPriceResponse)
async def get_market_price(card_id: str) -> MarketPriceResponse:
    return MarketPriceResponse(cardId=card_id, marketPrice=await client.fetch_market_price(card_id))


@app.post("/api/ai/slot-recommendations", response_model=SlotRecommendationsResponse)
async def get_slot_recommendations(
    request: Request,
    payload: SlotRecommendationRequest,
) -> SlotRecommendationsResponse:
    subject = resolve_rate_limit_subject(
        request.headers.get("x-forwarded-for"),
        request.client.host if request.client else None,
    )
    decision = await redis_state.increment_windowed_counter(
        "ratelimit:ai",
        subject,
        settings.ai_rate_limit_per_minute,
        settings.ai_rate_limit_per_hour,
    )
    if not decision.allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    if payload.templateId == "1x1":
        return SlotRecommendationsResponse(recommendations=[], cached=False)
    if any(placement.slotId == payload.selectedSlotId for placement in payload.placements):
        return SlotRecommendationsResponse(recommendations=[], cached=False)

    try:
        cache_key = recommendation_service.build_cache_key(payload)
        cached = await redis_state.get_json(cache_key)
        if cached is not None:
            return SlotRecommendationsResponse.model_validate({**cached, "cached": True})

        all_cards = await client.fetch_all_set_cards()
        recommendations = await recommendation_service.recommend(payload, all_cards)
        response_payload = SlotRecommendationsResponse(recommendations=recommendations, cached=False)
        await redis_state.set_json(
            cache_key,
            {"recommendations": [item.model_dump() for item in recommendations]},
            settings.ai_cache_ttl_seconds,
        )
        return response_payload
    except HTTPException:
        raise
    except Exception as error:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Could not load slot recommendations",
        ) from error


# use for indexing

# @app.get("/api/ai/premium-cards/export", response_model=PremiumCardExportResponse)
# async def export_premium_cards() -> PremiumCardExportResponse:
#     all_cards = await client.fetch_all_set_cards()
#     premium_cards = await recommendation_service.get_premium_catalog(all_cards)
#     return PremiumCardExportResponse(
#         version=f"{len(premium_cards)}-{settings.upstash_vector_namespace}",
#         namespace=settings.upstash_vector_namespace,
#         embeddingModel=settings.voyage_embedding_model,
#         cards=recommendation_service.build_export_records(premium_cards),
#     )


@app.get("/api/card-image")
async def get_card_image(url: str = Query(...)) -> Response:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return JSONResponse({"error": "Unsupported image URL protocol."}, status_code=400)

    if parsed.hostname not in allowed_card_image_hosts:
        return JSONResponse({"error": "Image host is not allowed."}, status_code=400)

    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=20.0) as http_client:
            upstream_response = await http_client.get(
                url,
                headers={"Accept": "image/*,*/*;q=0.8"},
            )
    except httpx.HTTPError:
        return JSONResponse({"error": "Could not fetch remote image."}, status_code=502)

    content_type = upstream_response.headers.get("content-type", "")
    if 300 <= upstream_response.status_code < 400:
        return JSONResponse({"error": "Redirected image URLs are not allowed."}, status_code=502)

    if upstream_response.status_code != 200:
        return JSONResponse(
            {"error": f"Remote image request failed with {upstream_response.status_code}."},
            status_code=502,
        )

    if not content_type.startswith("image/"):
        return JSONResponse({"error": "Remote URL did not return an image."}, status_code=415)

    return Response(
        content=upstream_response.content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )
