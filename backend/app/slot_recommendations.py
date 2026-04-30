from __future__ import annotations

from .config import Settings
from .models import CardRecord, SlotRecommendation, SlotRecommendationRequest
from .recommendation.premium_catalog import PremiumCatalog
from .recommendation.recommendation_profiles import PremiumCardProfile
from .recommendation.recommendation_ranking import (
    RankedCandidate,
    build_reason_text,
    diversify,
    score_candidate_metadata,
)
from .recommendation.recommendation_spatial import choose_anchor_cards, compose_query_vector
from .recommendation.vector_store import UpstashVectorClient


class SlotRecommendationService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._catalog = PremiumCatalog(settings)
        self._vector_client = UpstashVectorClient(settings)

    async def get_premium_catalog(self, all_cards: list[CardRecord]) -> list[PremiumCardProfile]:
        return await self._catalog.get_premium_catalog(all_cards)

    def build_export_records(self, cards: list[PremiumCardProfile]):
        return self._catalog.build_export_records(cards)

    def build_cache_key(self, request: SlotRecommendationRequest) -> str:
        return self._catalog.build_cache_key(request)

    async def recommend(
        self,
        request: SlotRecommendationRequest,
        all_cards: list[CardRecord],
    ) -> list[SlotRecommendation]:
        premium_catalog = await self.get_premium_catalog(all_cards)
        page_cards = [PremiumCardProfile.from_placement(item) for item in request.placements]
        placed_card_ids = {item.id for item in page_cards}
        premium_page_cards = [card for card in page_cards if self._is_premium(card)]

        if premium_page_cards:
            ranked = await self._recommend_from_vectors(
                request.selectedSlotId,
                page_cards,
                premium_page_cards,
                premium_catalog,
                placed_card_ids,
            )
        else:
            ranked = self._recommend_from_metadata(page_cards, premium_catalog, placed_card_ids)

        return [
            SlotRecommendation(
                id=item.card.id,
                setId=item.card.set_id,
                setName=item.card.set_name,
                cardSetId=item.card.card_set_id,
                name=item.card.name,
                imageUrl=item.card.image_url,
                marketPrice=item.card.market_price,
                rarity=item.card.rarity,
                color=item.card.color,
                type=item.card.card_type,
                subTypes=list(item.card.sub_types),
                reason=item.reason,
            )
            for item in diversify(ranked)[:5]
        ]

    async def _recommend_from_vectors(
        self,
        selected_slot_id: str,
        page_cards: list[PremiumCardProfile],
        premium_page_cards: list[PremiumCardProfile],
        premium_catalog: list[PremiumCardProfile],
        placed_card_ids: set[str],
    ) -> list[RankedCandidate]:
        anchors = choose_anchor_cards(
            selected_slot_id,
            premium_page_cards,
            affinity_score=lambda card: score_candidate_metadata(card, page_cards)[0],
        )
        vectors_by_id = await self._vector_client.fetch_vectors(
            [card.vector_id for card in premium_page_cards]
        )

        if not vectors_by_id:
            return self._recommend_from_metadata(page_cards, premium_catalog, placed_card_ids)

        query_vector = compose_query_vector(
            selected_slot_id,
            anchors,
            premium_page_cards,
            vectors_by_id,
        )
        if not query_vector:
            return self._recommend_from_metadata(page_cards, premium_catalog, placed_card_ids)

        raw_results = await self._vector_client.query(query_vector, top_k=50)
        premium_by_id = {card.id: card for card in premium_catalog}
        ranked: list[RankedCandidate] = []

        for item in raw_results:
            metadata = item.get("metadata") or {}
            candidate = premium_by_id.get(str(metadata.get("id", "")))
            if candidate is None or candidate.id in placed_card_ids:
                continue

            metadata_score, reasons = score_candidate_metadata(candidate, page_cards)
            total_score = float(item.get("score", 0.0)) * 0.6 + metadata_score * 0.4
            ranked.append(
                RankedCandidate(
                    card=candidate,
                    vector_score=float(item.get("score", 0.0)),
                    metadata_score=metadata_score,
                    reason=build_reason_text(reasons, visual=True),
                    total_score=total_score,
                )
            )

        ranked.sort(key=lambda item: (-item.total_score, item.card.card_set_id, item.card.id))
        return ranked

    def _recommend_from_metadata(
        self,
        page_cards: list[PremiumCardProfile],
        premium_catalog: list[PremiumCardProfile],
        placed_card_ids: set[str],
    ) -> list[RankedCandidate]:
        ranked: list[RankedCandidate] = []
        for candidate in premium_catalog:
            if candidate.id in placed_card_ids:
                continue

            metadata_score, reasons = score_candidate_metadata(candidate, page_cards)
            ranked.append(
                RankedCandidate(
                    card=candidate,
                    vector_score=0.0,
                    metadata_score=metadata_score,
                    reason=build_reason_text(reasons, visual=False),
                    total_score=metadata_score,
                )
            )

        ranked.sort(key=lambda item: (-item.total_score, item.card.card_set_id, item.card.id))
        return ranked[:50]

    def _is_premium(self, card: PremiumCardProfile) -> bool:
        return any(label.lower() in card.rarity.lower() for label in self._settings.premium_rarity_allowlist)
