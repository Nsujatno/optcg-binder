from __future__ import annotations

from typing import TypeAlias

from pydantic import BaseModel, ConfigDict, Field


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


class RecommendationPlacement(BaseModel):
    slotId: str
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
    subTypes: list[str]


class SlotRecommendationRequest(BaseModel):
    selectedSlotId: str
    templateId: str
    placements: list[RecommendationPlacement] = Field(max_length=15)


class SlotRecommendation(BaseModel):
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
    subTypes: list[str]
    reason: str


class SlotRecommendationsResponse(BaseModel):
    recommendations: list[SlotRecommendation]
    cached: bool = False


class PremiumCardExportRecord(BaseModel):
    id: str
    vectorId: str
    setId: str
    setName: str
    cardSetId: str
    name: str
    imageUrl: str
    marketPrice: float | None
    rarity: str
    color: str
    type: str
    subTypes: list[str]
    normalizedName: str
    normalizedNameFamily: str


class PremiumCardExportResponse(BaseModel):
    version: str
    namespace: str
    embeddingModel: str
    cards: list[PremiumCardExportRecord]
