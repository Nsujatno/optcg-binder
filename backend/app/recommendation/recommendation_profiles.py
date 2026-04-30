from __future__ import annotations

from dataclasses import dataclass

from ..ai_support import build_vector_id, normalized_name_family, normalize_text
from ..models import CardRecord, RecommendationPlacement


@dataclass(frozen=True)
class PremiumCardProfile:
    slot_id: str | None
    id: str
    vector_id: str
    set_id: str
    set_name: str
    card_set_id: str
    name: str
    image_url: str
    market_price: float | None
    rarity: str
    color: str
    card_type: str
    sub_types: tuple[str, ...]
    normalized_name: str
    normalized_name_family: str

    @classmethod
    def from_card(cls, card: CardRecord) -> "PremiumCardProfile":
        return cls(
            slot_id=None,
            id=card.id,
            vector_id=build_vector_id(card.cardSetId, card.imageUrl),
            set_id=card.setId,
            set_name=card.setName,
            card_set_id=card.cardSetId,
            name=card.name,
            image_url=card.imageUrl,
            market_price=card.marketPrice,
            rarity=card.rarity,
            color=card.color,
            card_type=card.type,
            sub_types=tuple(card.subTypes),
            normalized_name=normalize_text(card.name),
            normalized_name_family=normalized_name_family(card.name),
        )

    @classmethod
    def from_placement(cls, card: RecommendationPlacement) -> "PremiumCardProfile":
        return cls(
            slot_id=card.slotId,
            id=card.id,
            vector_id=build_vector_id(card.cardSetId, card.imageUrl),
            set_id=card.setId,
            set_name=card.setName,
            card_set_id=card.cardSetId,
            name=card.name,
            image_url=card.imageUrl,
            market_price=card.marketPrice,
            rarity=card.rarity,
            color=card.color,
            card_type=card.type,
            sub_types=tuple(card.subTypes),
            normalized_name=normalize_text(card.name),
            normalized_name_family=normalized_name_family(card.name),
        )
