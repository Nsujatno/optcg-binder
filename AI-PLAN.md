# AI Slot Matching Technical Plan

  ## Summary

  Build What Matches Here? as the first AI feature. A user selects an empty slot and requests
  suggestions; the backend returns 5-10 ranked cards with reasons and prices based on the
  current page context. Use Upstash Redis for per-IP rate limiting and short-lived caching,
  OpenAI embeddings for vector generation, and Upstash Vector for semantic retrieval.

  This plan intentionally does not include:

  - binder-photo-to-layout reconstruction
  - custom user image understanding
  - required accounts for v1
  - auto-placement without user confirmation

  ## Architecture And Interfaces

  ### Frontend behavior

  - Add a What matches here? action when an empty slot is selected.
  - Send a request containing:
      - targetSlotId
      - templateId
      - pagePlacements
      - normalized metadata for cards currently on the page
      - optional future knobs: budgetMax, sameSetOnly, sameColorOnly, limit
  - Render results in a modal or sidebar section with:
      - card image
      - card name / set code
      - market price
      - short explanation
      - Add to slot action
  - Keep current drag/drop flows unchanged; the suggestion action only pre-fills a chosen slot
    when the user clicks.

  ### Backend API

  - Add POST /api/ai/slot-suggestions.
  - Request schema:
      - targetSlotId: string
      - templateId: string
      - placements: [{ slotId, cardSetId, name, setId, color, type, rarity, text, subTypes,
        marketPrice }]
      - limit?: number default 5, max 10
      - optional filters: budgetMax, sameSetOnly, sameColorOnly
  - Response schema:
      - suggestions: [{ cardId, cardSetId, name, imageUrl, marketPrice, reason, score,
        semanticScore, heuristicScore }]
      - requestId: string
      - cached: boolean
  - Return 429 for rate-limit exhaustion and 503/502 for provider failures with simple JSON
    error payloads.

  ### Rate limiting with Upstash Redis

  - Use Upstash Redis as the shared store for rate-limit counters.
  - Keying:
      - normal endpoints: ratelimit:catalog:{ip}:{window}
      - AI endpoints: ratelimit:ai:{ip}:{window}
  - Use a fixed-window or sliding-window pattern stored in Redis with TTL.
  - Recommended v1 limits:
      - catalog routes: generous, e.g. 60-120 req/min/ip
      - AI route: stricter, e.g. 5-10 req/min/ip and an hourly cap
  - Add middleware or a reusable FastAPI dependency so limits are applied uniformly.
  - Trust proxy headers only through a controlled helper:
      - prefer x-forwarded-for first hop when present on Vercel
      - otherwise fall back to request client host
  - Add a short AI response cache in Redis keyed by normalized page context:
      - ai-slot-suggestions:{hash(context)}
      - TTL around 5-15 minutes
  - Store only counters and cached result payloads in Redis; do not store vectors there.

  ### Embeddings and vector search

  - Use OpenAI text-embedding-3-small for v1.
  - Use default 1536 dims initially; only reduce dimensions later if storage/query cost becomes
    a measured issue.
  - Build one canonical text representation per card for embedding, combining:
      - card name
      - cardSetId
      - set name / set code
      - color
      - type
      - rarity
      - subTypes
      - effect text
      - optional tags derived during preprocessing
  - Upsert vectors into Upstash Vector with metadata:
      - cardId
      - cardSetId
      - setId
      - name
      - color
      - type
      - rarity
      - marketPrice
      - imageUrl
      - any derived grouping tags
  - Query flow:
      - synthesize a context string from the target slot plus neighboring/page cards
      - embed the context string with the same embedding model
      - query Upstash Vector for top K semantic candidates
      - apply metadata filters before or after retrieval as supported
  - Do not use Gemini for v1; there is no current Google dependency in the repo, and adding
    Gemini plus Pinecone creates more vendors without a clear MVP benefit.

  ## Ranking, Data Flow, And Ingestion

  ### Recommendation pipeline

  - Stage 1: semantic retrieval
      - query Upstash Vector for top 25-50 candidates based on the page-context embedding
  - Stage 2: heuristic reranking
      - boost same set
      - boost same color
      - boost matching type/archetype/subtype terms
      - penalize cards already on the page
      - penalize cards above budgetMax when provided
      - optionally boost rarity balance or visual cohesion signals
  - Stage 3: explanation generation
      - v1 default should generate reasons deterministically from the matched features
      - do not require an LLM explanation step in v1
  - Final output:
      - return top 5-10 cards with both total score and short reason

  ### Ingestion and synchronization

  - Add an offline/backoffice embedding sync script or admin-only task:
      - fetch all cards from the normalized catalog source
      - build canonical embedding text
      - call OpenAI embeddings API in batches
      - upsert vectors + metadata into Upstash Vector
  - Trigger sync manually at first and rerun when:
      - card catalog changes materially
      - preprocessing logic changes
      - embedding model changes
  - Keep vector ingestion out of user-facing request paths.
  - Add environment variables for:
      - OPENAI_API_KEY
      - UPSTASH_REDIS_REST_URL
      - UPSTASH_REDIS_REST_TOKEN
      - UPSTASH_VECTOR_REST_URL
      - UPSTASH_VECTOR_REST_TOKEN
      - AI limits and cache TTLs
  - Abstract vector operations behind a small backend service layer so a future move to
    Pinecone is possible without rewriting endpoint logic.

  ### Scalability posture

  - v1 should optimize for low ops complexity, not maximum enterprise scale.
  - Use Upstash for both shared rate-limit state and vector search now.
  - Keep clear separation between:
      - embedding provider
      - vector store client
      - reranking logic
      - API endpoint contract
  - That separation keeps a future migration path open:
      - OpenAI + Upstash Vector now
      - OpenAI + Pinecone later if query volume, tooling, or search controls outgrow Upstash

  ## Test Plan

  - Empty slot suggestion request returns ranked cards with reasons and prices.
  - budgetMax excludes or penalizes cards above budget.
  - AI endpoint returns 429 when the per-IP AI limit is exceeded.
  - Catalog routes and AI routes use different rate-limit buckets.
  - Cached identical requests return faster and indicate cached: true.
  - Embedding sync script can ingest the full current catalog and upsert all vectors
    successfully.
  - Provider failures from OpenAI or Upstash return bounded, user-safe backend errors.
  - Missing or malformed IP headers still produce stable rate-limit behavior.

  ## Assumptions And Defaults

  - Upstash Redis is used for rate limits and AI response caching only.
  - Upstash Vector is used for vector storage and semantic retrieval; it is separate from
    Redis.
  - Upstash free tiers should be sufficient for MVP testing and light usage, but not assumed
    sufficient for long-term production traffic.
  - OpenAI text-embedding-3-small is the default embedding model for v1 because it is cheaper
    and simpler than adding a separate Gemini stack, and its default 1536 dimensions fit
    Upstash Vector limits.
  - v1 explanations are deterministic strings from matched features, not LLM-generated prose.
  - The current guest-first architecture remains intact; accounts are deferred until there is a
    real need for per-user quotas or premium AI controls.