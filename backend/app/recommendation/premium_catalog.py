from __future__ import annotations

from ..ai_support import stable_json_hash
from ..cache import TTLCache
from ..config import Settings
from ..models import CardRecord, PremiumCardExportRecord, SlotRecommendationRequest
from .recommendation_profiles import PremiumCardProfile


class PremiumCatalog:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._cache = TTLCache()

    async def get_premium_catalog(self, all_cards: list[CardRecord]) -> list[PremiumCardProfile]:
        cache_key = f"premium-catalog:{len(all_cards)}:{stable_json_hash([card.id for card in all_cards[:500]])}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        allowlist = tuple(item.lower() for item in self._settings.premium_rarity_allowlist)
        premium_cards = [
            PremiumCardProfile.from_card(card)
            for card in all_cards
            if any(label in card.rarity.lower() for label in allowlist)
        ]
        premium_cards.sort(key=lambda card: (card.card_set_id, card.id))
        return self._cache.set(cache_key, premium_cards, self._settings.premium_catalog_ttl_seconds)

    def build_export_records(self, cards: list[PremiumCardProfile]) -> list[PremiumCardExportRecord]:
        return [
            PremiumCardExportRecord(
                id=card.id,
                vectorId=card.vector_id,
                setId=card.set_id,
                setName=card.set_name,
                cardSetId=card.card_set_id,
                name=card.name,
                imageUrl=card.image_url,
                marketPrice=card.market_price,
                rarity=card.rarity,
                color=card.color,
                type=card.card_type,
                subTypes=list(card.sub_types),
                normalizedName=card.normalized_name,
                normalizedNameFamily=card.normalized_name_family,
            )
            for card in cards
        ]

    @staticmethod
    def build_cache_key(request: SlotRecommendationRequest) -> str:
        normalized_placements = [
            {
                "slotId": placement.slotId,
                "cardSetId": placement.cardSetId,
                "id": placement.id,
            }
            for placement in sorted(request.placements, key=lambda item: item.slotId)
        ]
        return (
            "ai-slot:"
            f"{stable_json_hash({'templateId': request.templateId, 'selectedSlotId': request.selectedSlotId, 'placements': normalized_placements})}"
        )
