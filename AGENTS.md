# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Application File Overview

## Root

### [PRD.md](C:/Users/natha/one-piece-binder/PRD.md)
Defines the product requirements and implementation direction for the One Piece TCG binder planner. It is the planning source of truth for the current MVP scope and future roadmap.

### [AGENTS.md](C:/Users/natha/one-piece-binder/AGENTS.md)
Documents the current repository structure and the role of the main files. It exists to help future contributors and coding agents orient themselves quickly.

### [package.json](C:/Users/natha/one-piece-binder/package.json)
Defines the workspace-level scripts and provides a single entry point for running the Next.js frontend and the active Python backend service in `backend`.

## AI Indexing Project

### [ai-indexer/README.md](C:/Users/natha/one-piece-binder/ai-indexer/README.md)
Documents the separate offline indexing workflow for premium-card visual matching. It explains the required environment, the sync commands, and the local cache and manifest behavior.

### [ai-indexer/sync.py](C:/Users/natha/one-piece-binder/ai-indexer/sync.py)
This is the CLI entry point for offline premium-card indexing. It supports full syncs, targeted syncs by unique IDs or vector IDs, and full rebuild runs.

### [ai-indexer/app/config.py](C:/Users/natha/one-piece-binder/ai-indexer/app/config.py)
Loads normalized runtime configuration for the indexing project, including backend export URL, Upstash Vector credentials, Voyage credentials, and local cache paths.

### [ai-indexer/app/indexer.py](C:/Users/natha/one-piece-binder/ai-indexer/app/indexer.py)
Implements the offline indexing flow. It fetches the backend premium export, caches images locally, generates Voyage image embeddings, upserts vectors into Upstash Vector, and appends to the local manifest while supporting resume behavior.

## Deployment Notes

### Vercel (Serverless)
The project is deployed on Vercel using serverless functions. The backend cache is process-local in-memory state, so it is not durable or shared across instances.

- Cached entries are available only while the same warm serverless instance handles requests.
- Cache is lost when an instance is recycled/spins down, when requests land on a different instance, or after a deployment.
- Current TTLs in `backend/app/optcg_client.py` are:
  - Sets: 1 hour
  - Cards by set: 1 hour
  - Search results: 15 minutes
  - Market price: 1 day
  - All-set cards: 1 hour

## Frontend App

### [frontend/package.json](C:/Users/natha/one-piece-binder/frontend/package.json)
Declares the Next.js frontend dependencies and scripts. It is the package boundary for the planner UI application.

### [frontend/app/page.tsx](C:/Users/natha/one-piece-binder/frontend/app/page.tsx)
This is the App Router entry page for the site. Its only role is to mount the top-level planner application component.

### [frontend/app/layout.tsx](C:/Users/natha/one-piece-binder/frontend/app/layout.tsx)
Defines the global HTML shell, fonts, and metadata for the Next.js app. It wraps every route and provides the base document structure.

### [frontend/app/globals.css](C:/Users/natha/one-piece-binder/frontend/app/globals.css)
Contains the global Tailwind import and base element styling. It establishes app-wide visual defaults such as fonts, box sizing, and image behavior.

## Planner UI

### [frontend/components/planner-app.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner-app.tsx)
This is the top-level client composition component for the planner experience. It wires the main hooks to the major UI surfaces and keeps page-level orchestration thin.

### [frontend/components/planner/planner-header.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-header.tsx)
Renders the application header and top-level layout actions like creating, duplicating, importing, and exporting layouts. Its role is global planner entry-point controls.

### [frontend/components/planner/catalog-sidebar.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/catalog-sidebar.tsx)
Displays the set picker, card search, and draggable card catalog. It is the planner's source panel for finding and selecting cards.

### [frontend/components/planner/planner-canvas/index.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/index.tsx)
Acts as the planner canvas composition module. It computes page sizing and totals, mounts the page navigation module, and composes the Michi art layer and card slot grid into the main editing surface.

### [frontend/components/planner/planner-canvas/navigation.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/navigation.tsx)
Defines the planner canvas page navigation module. It owns the previous and next page controls shown around the active binder page.

### [frontend/components/planner/planner-canvas/art-layer.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/art-layer.tsx)
Defines the planner canvas Michi art layer module. It renders placed art regions, selection state, drag behavior, and region deletion controls.

### [frontend/components/planner/planner-canvas/slot-grid.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/slot-grid.tsx)
Defines the planner canvas slot grid module. It renders card slots, card drag and drop behavior, upload affordances for empty slots, and slot clearing actions.

### [frontend/components/planner/inspector-sidebar.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/inspector-sidebar.tsx)
Shows slot details, theme controls, and selected Michi art actions. Its role is contextual editing and customization for the currently selected page element.

### [frontend/components/planner/crop-modal.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/crop-modal.tsx)
Provides the modal workflow for configuring uploaded artwork spans, crop offsets, zoom, and fit mode. It handles the interactive Michi placement preview before artwork is committed to the page.

## Planner State and Hooks

### [frontend/hooks/use-planner-state.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-planner-state.ts)
Composes the specialized planner hooks into a single interface consumed by the UI. Its role is coordination rather than owning detailed business logic itself.

### [frontend/hooks/use-catalog-data.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-catalog-data.ts)
Handles fetching sets and cards from the separate backend service, along with search state and loading and error state. It owns the planner's catalog data flow.

### [frontend/hooks/use-layout-manager.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-layout-manager.ts)
Acts as the React seam for binder editing. It wires the planner editor modules to React state, persistence effects, and UI-facing actions for layouts, pages, slots, and drag-and-drop behavior.

### [frontend/hooks/use-art-placement.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-art-placement.ts)
Encapsulates image upload, crop draft state, art region validation, and placement, edit, and delete logic. Its role is to isolate the Michi-specific workflow from the broader layout manager.

### [frontend/hooks/use-slot-recommendations.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-slot-recommendations.ts)
Owns the `What matches here?` UI flow for empty slots on eligible pages. It builds the current page context, calls the backend recommendation endpoint, manages the open/close state of the recommendation panel, and applies a chosen suggestion into the selected slot.

## Shared Frontend Logic

### [frontend/lib/types.ts](C:/Users/natha/one-piece-binder/frontend/lib/types.ts)
Defines the shared TypeScript domain models for cards, sets, themes, layouts, pages, assets, and art regions. It provides the common type contract across the planner, hooks, and API layer.

### [frontend/lib/planner.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner.ts)
Contains planner-specific constants and utility functions such as template lookup, slot helpers, local storage keys, and asset conversion. Its role is shared planner infrastructure that should not live inside React components.

### [frontend/lib/planner-layout-editor.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner-layout-editor.ts)
Defines the planner layout editor module for binder mutations. It owns pure layout, page, slot, theme, import/export, and card snapshot update operations used by the React hook seam.

### [frontend/lib/planner-layout-selectors.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner-layout-selectors.ts)
Defines the planner layout selector module. It owns derived planner lookups such as active layout selection, occupied art slots, available slots, template validation maps, and placement-backed card resolution.

### [frontend/lib/catalog-sample.ts](C:/Users/natha/one-piece-binder/frontend/lib/catalog-sample.ts)
Provides a local fallback sample catalog for development or API failure cases. It ensures the planner can still function when the external card source is unavailable.

### [frontend/lib/api-client.ts](C:/Users/natha/one-piece-binder/frontend/lib/api-client.ts)
Provides typed frontend wrappers for calling the separate backend service. Its role is to keep raw endpoint strings and request mechanics out of the React hooks and UI components, including the AI slot recommendation request.

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
