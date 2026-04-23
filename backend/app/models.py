from __future__ import annotations

from typing import TypeAlias

from pydantic import BaseModel, ConfigDict


ScalarValue: TypeAlias = str | int | float


class ExternalSet(BaseModel):
    set_name: str
    set_id: str


class ExternalCard(BaseModel):
    model_config = ConfigDict(extra="ignore")

    inventory_price: float | None = None
    market_price: float | None = None
    card_name: str
    set_name: str
    card_text: str | None = ""
    set_id: str
    rarity: str
    card_set_id: str
    card_color: str
    card_type: str
    life: ScalarValue | None = None
    card_cost: ScalarValue | None = None
    card_power: ScalarValue | None = None
    sub_types: str | list[str] | None = ""
    counter_amount: ScalarValue | None = None
    attribute: ScalarValue | None = None
    date_scraped: str | None = None
    card_image_id: str | None = None
    card_image: str | None = None


class SetRecord(BaseModel):
    id: str
    name: str
    code: str
    cardCount: int = 0


class CardRecord(BaseModel):
    id: str
    setId: str
    setName: str
    cardSetId: str
    name: str
    imageUrl: str
    marketPrice: float | None
    rarity: str
    color: str
    type: str
    cost: str | None
    power: str | None
    life: str | None
    counter: int | None
    attribute: str | None
    subTypes: list[str]
    text: str
    scrapedAt: str | None


class SetsResponse(BaseModel):
    sets: list[SetRecord]


class CardsResponse(BaseModel):
    cards: list[CardRecord]


class MarketPriceResponse(BaseModel):
    cardId: str
    marketPrice: float | None
