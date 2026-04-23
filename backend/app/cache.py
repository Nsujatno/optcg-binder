from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from time import monotonic
from typing import Generic, TypeVar


T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    value: T
    expires_at: float


class TTLCache:
    def __init__(self) -> None:
        self._entries: dict[str, CacheEntry[object]] = {}
        self._lock = Lock()

    def get(self, key: str) -> T | None:
        now = monotonic()

        with self._lock:
            entry = self._entries.get(key)
            if entry and entry.expires_at > now:
                return entry.value  # type: ignore[return-value]

            if entry:
                del self._entries[key]

        return None

    def set(self, key: str, value: T, ttl_seconds: int) -> T:
        now = monotonic()
        with self._lock:
            self._entries[key] = CacheEntry(value=value, expires_at=now + ttl_seconds)

        return value
