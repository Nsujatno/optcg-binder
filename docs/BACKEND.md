## Backend Service

### [backend/requirements.txt](C:/Users/natha/one-piece-binder/backend/requirements.txt)
Lists the Python packages required to run the active backend service, including FastAPI, Uvicorn, HTTPX, and dotenv support for local environment loading.

### [backend/.env.example](C:/Users/natha/one-piece-binder/backend/.env.example)
Documents the Python backend environment variables for local development, including the OPTCG source configuration, Upstash Redis and Vector credentials, premium-card filtering, and AI cache and rate-limit settings.

### [backend/app/main.py](C:/Users/natha/one-piece-binder/backend/app/main.py)
Defines the FastAPI application composition module. It creates the app, applies CORS, and mounts the domain route modules from `backend/app/routes`.

### [backend/app/config.py](C:/Users/natha/one-piece-binder/backend/app/config.py)
Loads normalized runtime configuration for the Python backend from environment variables and the local `backend/.env` file.

### [backend/app/dependencies.py](C:/Users/natha/one-piece-binder/backend/app/dependencies.py)
Defines the shared backend adapter seam. It constructs and exposes the normalized runtime dependencies used by route modules, including settings, the OPTCG client, the recommendation modules, the Redis-backed state adapter, and allowed card-image hosts.

### [backend/app/contracts/models.py](C:/Users/natha/one-piece-binder/backend/app/contracts/models.py)
Defines the backend contract models. It holds the Pydantic validation models for upstream OPTCG API payloads, normalized catalog response models, and AI recommendation and premium export request and response models.

### [backend/app/optcg_client.py](C:/Users/natha/one-piece-binder/backend/app/optcg_client.py)
Handles all live OPTCG API calls, caches results with TTLs, and normalizes raw set and card data into the frontend-facing contract without using hardcoded catalog fixtures.

### [backend/app/shared/cache.py](C:/Users/natha/one-piece-binder/backend/app/shared/cache.py)
Implements the backend's lightweight in-memory TTL cache. It is shared infrastructure used by upstream catalog loading and local AI support fallbacks.

### [backend/app/shared/ai_support.py](C:/Users/natha/one-piece-binder/backend/app/shared/ai_support.py)
Provides shared AI support infrastructure, including normalized text and vector ID helpers, request cache hashing, rate-limit subject resolution, and the Redis-backed state adapter with local fallback behavior.

### [backend/app/recommendation/service.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/service.py)
Acts as the slot recommendation orchestration module. It chooses between the visual vector path and the metadata-only fallback path, then shapes the final recommendation records returned to the planner UI.

### [backend/app/recommendation/requests.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/requests.py)
Defines the slot recommendation request module. It owns the non-HTTP request pipeline for rate limiting, request guards, response cache lookup and write-back, card loading, and final response assembly before the route adapter returns the payload.

### [backend/app/routes/health.py](C:/Users/natha/one-piece-binder/backend/app/routes/health.py)
Defines the backend health route module. Its only role is to expose the lightweight liveness check.

### [backend/app/routes/catalog.py](C:/Users/natha/one-piece-binder/backend/app/routes/catalog.py)
Defines the catalog route module. It owns the HTTP handlers for set lookup, set card lookup, card search, filtered card lookup, and market price lookup.

### [backend/app/routes/recommendations.py](C:/Users/natha/one-piece-binder/backend/app/routes/recommendations.py)
Defines the AI slot recommendation route module. It is the thin HTTP adapter that resolves the request subject and delegates the recommendation request pipeline into the slot recommendation request module.

### [backend/app/routes/card_image.py](C:/Users/natha/one-piece-binder/backend/app/routes/card_image.py)
Defines the card-image proxy route module. It validates allowed hosts and image responses before returning proxied remote card art to the frontend.

### [backend/app/recommendation/premium_catalog.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/premium_catalog.py)
Owns premium-card filtering, cached premium catalog construction, premium export shaping, and cache-key generation for recommendation requests.

### [backend/app/recommendation/recommendation_profiles.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/recommendation_profiles.py)
Defines the normalized premium-card profile used throughout the recommendation flow. It is the shared shape for catalog cards, page placements, vector IDs, and normalized name-family data.

### [backend/app/recommendation/recommendation_spatial.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/recommendation_spatial.py)
Handles spatial recommendation logic such as anchor selection, slot-distance weighting, and weighted vector composition around the target slot.

### [backend/app/recommendation/recommendation_ranking.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/recommendation_ranking.py)
Encapsulates metadata scoring, deterministic explanation text, and result diversification rules for recommendation candidates.

### [backend/app/recommendation/vector_store.py](C:/Users/natha/one-piece-binder/backend/app/recommendation/vector_store.py)
Implements the Upstash Vector adapter used by the recommendation flow for vector fetches and nearest-neighbor queries.
