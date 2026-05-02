from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any

import httpx

from ..config import Settings
from .cache import TTLCache


FAMILY_STOP_WORDS = {
    "charlotte",
    "donquixote",
    "dr",
    "edward",
    "kozuki",
    "monkey",
    "portgas",
    "roronoa",
    "trafalgar",
    "vinsmoke",
}


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def normalized_name_family(name: str) -> str:
    tokens = [token for token in normalize_text(name).split() if token]
    filtered = [token for token in tokens if token not in FAMILY_STOP_WORDS]
    return " ".join(filtered[:2] or tokens[:2] or ["unknown"])


def build_vector_id(card_set_id: str, image_url: str) -> str:
    suffix = hashlib.sha1(image_url.encode("utf-8")).hexdigest()[:12]
    return f"card:{normalize_text(card_set_id).replace(' ', '-') or 'unknown'}:{suffix}"


def stable_json_hash(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def resolve_rate_limit_subject(x_forwarded_for: str | None, client_host: str | None) -> str:
    if x_forwarded_for:
        forwarded = x_forwarded_for.split(",")[0].strip()
        if forwarded:
            return forwarded
    return client_host or "unknown"


@dataclass
class RateLimitDecision:
    allowed: bool
    minute_count: int
    hour_count: int


class RedisBackedState:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._local_cache: TTLCache[object] = TTLCache(
            maxsize=2048,
            ttl_seconds=60 * 60,
        )

    @property
    def enabled(self) -> bool:
        return bool(self._settings.upstash_redis_rest_url and self._settings.upstash_redis_rest_token)

    async def get_json(self, key: str) -> dict[str, Any] | None:
        if not self.enabled:
            return self._local_cache.get(key)

        response = await self._post_pipeline([["GET", key]])
        value = response[0].get("result")
        if not value:
            return None
        return json.loads(value)

    async def set_json(self, key: str, value: dict[str, Any], ttl_seconds: int) -> None:
        if not self.enabled:
            self._local_cache.set(key, value)
            return

        await self._post_pipeline([["SETEX", key, ttl_seconds, json.dumps(value)]])

    async def increment_windowed_counter(
        self,
        key_prefix: str,
        subject: str,
        minute_limit: int,
        hour_limit: int,
    ) -> RateLimitDecision:
        minute_window = self._time_window_key("minute")
        hour_window = self._time_window_key("hour")
        minute_key = f"{key_prefix}:{subject}:{minute_window}"
        hour_key = f"{key_prefix}:{subject}:{hour_window}"

        if not self.enabled:
            minute_count = self._increment_local(minute_key, 60)
            hour_count = self._increment_local(hour_key, 60 * 60)
        else:
            result = await self._post_pipeline(
                [
                    ["INCR", minute_key],
                    ["EXPIRE", minute_key, 60],
                    ["INCR", hour_key],
                    ["EXPIRE", hour_key, 60 * 60],
                ]
            )
            minute_count = int(result[0].get("result", 0))
            hour_count = int(result[2].get("result", 0))

        allowed = minute_count <= minute_limit and hour_count <= hour_limit
        return RateLimitDecision(allowed=allowed, minute_count=minute_count, hour_count=hour_count)

    def _increment_local(self, key: str, ttl_seconds: int) -> int:
        del ttl_seconds
        current = self._local_cache.get(key) or 0
        next_value = int(current) + 1
        self._local_cache.set(key, next_value)
        return next_value

    @staticmethod
    def _time_window_key(kind: str) -> str:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        if kind == "minute":
            return now.strftime("%Y%m%d%H%M")
        return now.strftime("%Y%m%d%H")

    async def _post_pipeline(self, commands: list[list[Any]]) -> list[dict[str, Any]]:
        assert self._settings.upstash_redis_rest_url is not None
        assert self._settings.upstash_redis_rest_token is not None

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{self._settings.upstash_redis_rest_url.rstrip('/')}/pipeline",
                headers={"Authorization": f"Bearer {self._settings.upstash_redis_rest_token}"},
                json=commands,
            )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list):
            raise ValueError("Unexpected Upstash Redis response")
        return payload
