from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..contracts.models import CardsResponse, MarketPriceResponse, SetsResponse
from ..dependencies import BackendDependencies, get_backend_dependencies


router = APIRouter(prefix="/api")


@router.get("/sets", response_model=SetsResponse)
async def get_sets(
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> SetsResponse:
    return SetsResponse(sets=await dependencies.client.fetch_sets())


@router.get("/sets/{set_id}/cards", response_model=CardsResponse)
async def get_cards_by_set(
    set_id: str,
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> CardsResponse:
    return CardsResponse(cards=await dependencies.client.fetch_cards_by_set(set_id))


@router.get("/cards/search", response_model=CardsResponse)
async def search_cards(
    q: str = Query(default=""),
    setId: str | None = Query(default=None),
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> CardsResponse:
    return CardsResponse(cards=await dependencies.client.search_cards(q, setId))


@router.get("/cards/filtered", response_model=CardsResponse)
async def get_filtered_cards(
    card_name: str = Query(default=""),
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> CardsResponse:
    return CardsResponse(
        cards=await dependencies.client.fetch_cards_filtered_by_name(card_name)
    )


@router.get("/cards/{card_id}/market", response_model=MarketPriceResponse)
async def get_market_price(
    card_id: str,
    dependencies: BackendDependencies = Depends(get_backend_dependencies),
) -> MarketPriceResponse:
    return MarketPriceResponse(
        cardId=card_id,
        marketPrice=await dependencies.client.fetch_market_price(card_id),
    )
