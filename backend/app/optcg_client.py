from __future__ import annotations

from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from .cache import TTLCache
from .models import CardRecord, ExternalCard, ExternalSet, SetRecord


ONE_HOUR = 60 * 60
FIFTEEN_MINUTES = 15 * 60
ONE_DAY = 24 * 60 * 60

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
        cached = self.sets_cache.get("sets")
        if cached is not None:
            return cached

        payload = await self._fetch_json("/allSets/")
        sets = [self._normalize_set(item) for item in payload]
        sets.sort(key=lambda item: item.code)
        return self.sets_cache.set("sets", sets)

    async def fetch_cards_by_set(self, set_id: str) -> list[CardRecord]:
        cache_key = f"set:{set_id}:cards"
        cached = self.set_cards_cache.get(cache_key)
        if cached is not None:
            return cached

        payload = await self._fetch_json(f"/sets/{set_id}/")
        cards = [self._normalize_card(item) for item in payload]
        cards.sort(key=lambda item: item.cardSetId)
        return self.set_cards_cache.set(cache_key, cards)

    async def search_cards(self, query: str, set_id: str | None) -> list[CardRecord]:
        normalized_query = query.strip().lower()
        cache_key = f"search:{set_id or 'all'}:{normalized_query}"
        cached = self.search_cache.get(cache_key)
        if cached is not None:
            return cached

        if set_id:
            cards = await self.fetch_cards_by_set(set_id)
        else:
            cards = await self.fetch_all_set_cards()

        if not normalized_query:
            results = cards[:100]
        else:
            results = [
                card
                for card in cards
                if normalized_query
                in " ".join(
                    [
                        card.name,
                        card.cardSetId,
                        card.text,
                        card.type,
                        card.color,
                        card.rarity,
                        " ".join(card.subTypes),
                    ]
                ).lower()
            ][:100]

        return self.search_cache.set(cache_key, results)

    async def fetch_market_price(self, card_id: str) -> float | None:
        cache_key = f"market:{card_id}"
        cached = self.market_cache.get(cache_key)
        if cached is not None:
            return cached

        payload = await self._fetch_json(f"/sets/card/{card_id}/")
        if not payload:
            return None

        market_price = ExternalCard.model_validate(payload[0]).market_price
        return self.market_cache.set(cache_key, market_price)

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
    def _normalize_set(payload: object) -> SetRecord:
        item = ExternalSet.model_validate(payload)
        return SetRecord(
            id=item.set_id,
            name=item.set_name,
            code=item.set_id,
            cardCount=0,
        )

    @staticmethod
    def _normalize_card(payload: object) -> CardRecord:
        item = ExternalCard.model_validate(payload)
        image_url = item.card_image or (
            f"https://www.optcgapi.com/media/static/Card_Images/{item.card_image_id}.jpg"
            if item.card_image_id
            else ""
        )

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
