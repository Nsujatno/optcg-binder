from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import CardsResponse, MarketPriceResponse, SetsResponse
from .optcg_client import OptcgClient


settings = get_settings()
client = OptcgClient(settings.optcg_api_base)
allowed_card_image_hosts = {"optcgapi.com", "www.optcgapi.com"}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
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
