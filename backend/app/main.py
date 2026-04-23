from __future__ import annotations

from fastapi import FastAPI, Query
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
