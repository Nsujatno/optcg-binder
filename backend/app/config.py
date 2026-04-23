from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    port: int = 8000
    frontend_origin: str = "http://localhost:3000"
    optcg_api_base: str = "https://www.optcgapi.com/api"


def get_settings() -> Settings:
    return Settings(
        port=int(os.getenv("PORT", "8000")),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        optcg_api_base=os.getenv("OPTCG_API_BASE", "https://www.optcgapi.com/api").rstrip("/"),
    )
