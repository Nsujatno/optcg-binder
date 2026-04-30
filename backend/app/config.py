from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@dataclass(frozen=True)
class Settings:
    port: int = 8000
    frontend_origin: str = "http://localhost:3000"
    optcg_api_base: str = "https://www.optcgapi.com/api"
    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: str | None = None
    upstash_vector_rest_url: str | None = None
    upstash_vector_rest_token: str | None = None
    upstash_vector_namespace: str = "premium-v1"
    premium_rarity_allowlist: tuple[str, ...] = ("Alt Art", "Parallel", "SP", "AAE", "Manga")
    ai_rate_limit_per_minute: int = 10
    ai_rate_limit_per_hour: int = 60
    ai_cache_ttl_seconds: int = 15 * 60
    premium_catalog_ttl_seconds: int = 60 * 60
    voyage_embedding_model: str = "voyage-multimodal-3.5"


def get_settings() -> Settings:
    premium_rarity_allowlist = tuple(
        item.strip()
        for item in os.getenv(
            "PREMIUM_RARITY_ALLOWLIST",
            "PR,TR,SEC",
        ).split(",")
        if item.strip()
    )
    return Settings(
        port=int(os.getenv("PORT", "8000")),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        optcg_api_base=os.getenv("OPTCG_API_BASE", "https://www.optcgapi.com/api").rstrip("/"),
        upstash_redis_rest_url=os.getenv("UPSTASH_REDIS_REST_URL"),
        upstash_redis_rest_token=os.getenv("UPSTASH_REDIS_REST_TOKEN"),
        upstash_vector_rest_url=os.getenv("UPSTASH_VECTOR_REST_URL"),
        upstash_vector_rest_token=os.getenv("UPSTASH_VECTOR_REST_TOKEN"),
        upstash_vector_namespace=os.getenv("UPSTASH_VECTOR_NAMESPACE", "premium-v1").strip() or "premium-v1",
        premium_rarity_allowlist=premium_rarity_allowlist,
        ai_rate_limit_per_minute=int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "10")),
        ai_rate_limit_per_hour=int(os.getenv("AI_RATE_LIMIT_PER_HOUR", "60")),
        ai_cache_ttl_seconds=int(os.getenv("AI_CACHE_TTL_SECONDS", str(15 * 60))),
        premium_catalog_ttl_seconds=int(os.getenv("PREMIUM_CATALOG_TTL_SECONDS", str(60 * 60))),
        voyage_embedding_model=os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-multimodal-3.5"),
    )
