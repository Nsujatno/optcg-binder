from __future__ import annotations

from typing import Any

import httpx

from ..config import Settings


class UpstashVectorClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self._settings.upstash_vector_rest_url and self._settings.upstash_vector_rest_token)

    async def fetch_vectors(self, ids: list[str]) -> dict[str, list[float]]:
        if not ids or not self.enabled:
            return {}

        response = await self._post(
            "fetch",
            {"ids": ids, "includeVectors": True, "includeMetadata": False},
        )
        vectors: dict[str, list[float]] = {}
        for item in response.get("result", []):
            if item and item.get("id") and item.get("vector"):
                vectors[str(item["id"])] = [float(value) for value in item["vector"]]
        return vectors

    async def query(self, vector: list[float], top_k: int) -> list[dict[str, Any]]:
        if not vector or not self.enabled:
            return []

        response = await self._post(
            "query",
            {"vector": vector, "topK": top_k, "includeMetadata": True},
        )
        return list(response.get("result", []))

    async def _post(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        assert self._settings.upstash_vector_rest_url is not None
        assert self._settings.upstash_vector_rest_token is not None

        namespace = self._settings.upstash_vector_namespace.strip("/")
        path = (
            f"{self._settings.upstash_vector_rest_url.rstrip('/')}/{endpoint}/{namespace}"
            if namespace
            else f"{self._settings.upstash_vector_rest_url.rstrip('/')}/{endpoint}"
        )
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                path,
                headers={"Authorization": f"Bearer {self._settings.upstash_vector_rest_token}"},
                json=payload,
            )
        response.raise_for_status()
        return response.json()
