from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import CardsResponse, MarketPriceResponse, SetsResponse
from .optcg_client import OptcgClient


settings = get_settings()
client = OptcgClient(settings.optcg_api_base)

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
        return Response(
            content=b'{"error":"Unsupported image URL protocol."}',
            status_code=400,
            media_type="application/json",
        )

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as http_client:
            upstream_response = await http_client.get(
                url,
                headers={"Accept": "image/*,*/*;q=0.8"},
            )
    except httpx.HTTPError:
        return Response(
            content=b'{"error":"Could not fetch remote image."}',
            status_code=502,
            media_type="application/json",
        )

    content_type = upstream_response.headers.get("content-type", "")
    if upstream_response.status_code != 200:
        return Response(
            content=(
                f'{{"error":"Remote image request failed with {upstream_response.status_code}."}}'
            ).encode("utf-8"),
            status_code=502,
            media_type="application/json",
        )

    if not content_type.startswith("image/"):
        return Response(
            content=b'{"error":"Remote URL did not return an image."}',
            status_code=415,
            media_type="application/json",
        )

    return Response(
        content=upstream_response.content,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
    )
