from __future__ import annotations

from threading import Lock
from typing import Generic, TypeVar

from cachetools import TTLCache as CachetoolsTTLCache


T = TypeVar("T")


class TTLCache:
    def __init__(self, maxsize: int, ttl_seconds: int) -> None:
        self._entries: CachetoolsTTLCache[str, object] = CachetoolsTTLCache(
            maxsize=maxsize,
            ttl=ttl_seconds,
        )
        self._lock = Lock()

    def get(self, key: str) -> T | None:
        with self._lock:
            value = self._entries.get(key)
            return value if value is not None else None  # type: ignore[return-value]

    def set(self, key: str, value: T) -> T:
        with self._lock:
            self._entries[key] = value

        return value
