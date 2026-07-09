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

