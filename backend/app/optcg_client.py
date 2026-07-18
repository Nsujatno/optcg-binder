from __future__ import annotations

import asyncio
from collections.abc import Callable
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from .contracts.models import (
    CardRecord,
    ExternalCard,
    ExternalDeck,
    ExternalDonCard,
    ExternalSet,
    SetRecord,
)
from .shared.cache import TTLCache


ONE_HOUR = 60 * 60
FIFTEEN_MINUTES = 15 * 60
ONE_DAY = 24 * 60 * 60

DON_SOURCE_ID = "DON"

IMAGE_URL_TEMPLATE = "https://www.optcgapi.com/media/static/Card_Images/{image_id}.jpg"

SETS_CACHE_MAXSIZE = 8
SET_CARDS_CACHE_MAXSIZE = 64
SEARCH_CACHE_MAXSIZE = 256
MARKET_CACHE_MAXSIZE = 1024
ALL_SET_CARDS_CACHE_MAXSIZE = 8


class OptcgClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.sets_cache: TTLCache[list[SetRecord]] = TTLCache(
            maxsize=SETS_CACHE_MAXSIZE,
            ttl_seconds=ONE_HOUR,
        )
        self.set_cards_cache: TTLCache[list[CardRecord]] = TTLCache(
            maxsize=SET_CARDS_CACHE_MAXSIZE,
            ttl_seconds=ONE_HOUR,
        )
        self.search_cache: TTLCache[list[CardRecord]] = TTLCache(
            maxsize=SEARCH_CACHE_MAXSIZE,
            ttl_seconds=FIFTEEN_MINUTES,
        )
        self.market_cache: TTLCache[float | None] = TTLCache(
            maxsize=MARKET_CACHE_MAXSIZE,
            ttl_seconds=ONE_DAY,
        )
        self.all_set_cards_cache: TTLCache[list[CardRecord]] = TTLCache(
            maxsize=ALL_SET_CARDS_CACHE_MAXSIZE,
            ttl_seconds=ONE_HOUR,
        )

    async def fetch_sets(self) -> list[SetRecord]:
        """Return every browsable source: booster sets, starter decks, and DON!!."""
        cached = self.sets_cache.get("sets")
        if cached is not None:
            return cached

        booster, starters = await asyncio.gather(
            self._fetch_booster_sets(),
            self._fetch_starter_decks(),
        )
        sources = [*booster, *starters, self._don_source()]
        return self.sets_cache.set("sets", sources)

    async def fetch_cards_by_set(self, set_id: str) -> list[CardRecord]:
        """Load cards for a browse source, dispatching by source id."""
        cache_key = f"set:{set_id}:cards"
        cached = self.set_cards_cache.get(cache_key)
        if cached is not None:
            return cached

        if set_id == DON_SOURCE_ID:
            payload = await self._fetch_json("/allDonCards/")
            cards = [self._normalize_don_card(item) for item in payload]
        elif set_id.startswith("ST"):
            payload = await self._fetch_json(f"/decks/{set_id}/")
            cards = [self._normalize_card(item) for item in payload]
        else:
            payload = await self._fetch_json(f"/sets/{set_id}/")
            cards = [self._normalize_card(item) for item in payload]

        cards.sort(key=lambda item: item.cardSetId)
        return self.set_cards_cache.set(cache_key, cards)

    async def fetch_cards_filtered_by_name(self, card_name: str) -> list[CardRecord]:
        """Search every source in parallel and merge the deduped results."""
        normalized_query = card_name.strip().lower()
        if not normalized_query:
            return []

        cache_key = f"filtered-name:{normalized_query}"
        cached = self.search_cache.get(cache_key)
        if cached is not None:
            return cached

        query = card_name.strip()
        results = await asyncio.gather(
            self._search_source("/sets/filtered/", query, self._normalize_card),
            self._search_source("/decks/filtered/", query, self._normalize_card),
            self._search_source("/promos/filtered/", query, self._normalize_card),
            self._search_source("/don/filtered/", query, self._normalize_don_card),
            return_exceptions=True,
        )

        # Dedupe by card id (image URL); a single failing source must not break search.
        merged: dict[str, CardRecord] = {}
        for result in results:
            if isinstance(result, BaseException):
                continue
            for card in result:
                merged.setdefault(card.id, card)

        cards = sorted(merged.values(), key=lambda item: item.cardSetId)
        return self.search_cache.set(cache_key, cards)

    async def fetch_market_price(self, card_id: str) -> float | None:
        cache_key = f"market:{card_id}"
        cached = self.market_cache.get(cache_key)
        if cached is not None:
            return cached

        if card_id == DON_SOURCE_ID or card_id.startswith("don"):
            # DON!! cards have no dedicated market endpoint; price rides on the list payload.
            return None
        if card_id.startswith("ST"):
            path = f"/decks/card/{card_id}/"
        elif card_id.startswith("P-"):
            path = f"/promos/card/{card_id}/"
        else:
            path = f"/sets/card/{card_id}/"

        payload = await self._fetch_json(path)
        if not payload:
            return None

        market_price = ExternalCard.model_validate(payload[0]).market_price
        return self.market_cache.set(cache_key, market_price)

    async def _fetch_booster_sets(self) -> list[SetRecord]:
        payload = await self._fetch_json("/allSets/")
        sets = [self._normalize_set(item) for item in payload]
        sets.sort(key=lambda item: item.code)
        return sets

    async def _fetch_starter_decks(self) -> list[SetRecord]:
        payload = await self._fetch_json("/allDecks/")
        decks = [self._normalize_deck(item) for item in payload]
        decks.sort(key=lambda item: item.code)
        return decks

    async def _search_source(
        self,
        path: str,
        query: str,
        normalizer: Callable[[object], CardRecord],
    ) -> list[CardRecord]:
        payload = await self._fetch_json(path, params={"card_name": query})
        return [normalizer(item) for item in payload]

    @staticmethod
    def _don_source() -> SetRecord:
        return SetRecord(
            id=DON_SOURCE_ID,
            name="DON!! Cards",
            code=DON_SOURCE_ID,
            category="don",
        )

    async def fetch_all_set_cards(self) -> list[CardRecord]:
        cached = self.all_set_cards_cache.get("all-set-cards")
        if cached is not None:
            return cached

        payload = await self._fetch_json("/allSetCards/")
        cards = [self._normalize_card(item) for item in payload]
        return self.all_set_cards_cache.set("all-set-cards", cards)

    async def _fetch_json(self, path: str, params: dict[str, str] | None = None) -> object:
        url = f"{self.base_url}{path}"
        if params:
            url = f"{url}?{urlencode(params)}"

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, headers={"Accept": "application/json"})
        except httpx.HTTPError as error:
            raise HTTPException(status_code=502, detail=f"Could not reach OPTCG API: {error}") from error

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"OPTCG API returned {response.status_code} for {path}",
            )

        try:
            return response.json()
        except ValueError as error:
            raise HTTPException(status_code=502, detail="OPTCG API returned invalid JSON") from error

    @staticmethod
    def _resolve_image_url(card_image: str | None, card_image_id: str | None) -> str:
        if card_image:
            return card_image
        if card_image_id:
            return IMAGE_URL_TEMPLATE.format(image_id=card_image_id)
        return ""

    @staticmethod
    def _normalize_set(payload: object) -> SetRecord:
        item = ExternalSet.model_validate(payload)
        return SetRecord(
            id=item.set_id,
            name=item.set_name,
            code=item.set_id,
            cardCount=0,
            category="booster",
        )

    @staticmethod
    def _normalize_deck(payload: object) -> SetRecord:
        item = ExternalDeck.model_validate(payload)
        return SetRecord(
            id=item.structure_deck_id,
            name=item.structure_deck_name,
            code=item.structure_deck_id,
            cardCount=0,
            category="starter",
        )

    @staticmethod
    def _normalize_don_card(payload: object) -> CardRecord:
        item = ExternalDonCard.model_validate(payload)
        image_url = OptcgClient._resolve_image_url(item.card_image, item.card_image_id)
        if not image_url:
            raise HTTPException(
                status_code=502,
                detail=f"DON card {item.card_name} is missing an image URL",
            )

        return CardRecord(
            id=image_url,
            setId=DON_SOURCE_ID,
            setName="DON!!",
            cardSetId=item.don_id or item.card_image_id or "",
            name=item.card_name,
            imageUrl=image_url,
            marketPrice=item.market_price,
            rarity=item.rarity,
            color="",
            type=item.card_type,
            cost=None,
            power=None,
            life=None,
            counter=None,
            attribute=None,
            subTypes=[],
            text=item.card_text or "",
            scrapedAt=item.date_scraped,
        )

    @staticmethod
    def _normalize_card(payload: object) -> CardRecord:
        item = ExternalCard.model_validate(payload)
        image_url = OptcgClient._resolve_image_url(item.card_image, item.card_image_id)

        if not image_url:
            raise HTTPException(status_code=502, detail=f"Card {item.card_set_id} is missing an image URL")

        counter: int | None = None
        if item.counter_amount is not None and item.counter_amount != "":
            try:
                counter = int(item.counter_amount)
            except ValueError:
                counter = None

        if isinstance(item.sub_types, list):
            sub_types = [str(value).strip() for value in item.sub_types if str(value).strip()]
        else:
            sub_types = [
                value.strip()
                for value in str(item.sub_types or "").split("/")
                if value.strip()
            ]

        return CardRecord(
            id=image_url,
            setId=item.set_id,
            setName=item.set_name,
            cardSetId=item.card_set_id,
            name=item.card_name,
            imageUrl=image_url,
            marketPrice=item.market_price,
            rarity=item.rarity,
            color=item.card_color,
            type=item.card_type,
            cost=str(item.card_cost) if item.card_cost is not None else None,
            power=str(item.card_power) if item.card_power is not None else None,
            life=str(item.life) if item.life is not None else None,
            counter=counter,
            attribute=str(item.attribute) if item.attribute is not None else None,
            subTypes=sub_types,
            text=item.card_text or "",
            scrapedAt=item.date_scraped,
        )
