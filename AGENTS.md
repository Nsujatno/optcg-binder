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
Defines the workspace-level scripts and provides a single entry point for running the Next.js frontend and the active Python backend service in `backend1`.

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

### [frontend/components/planner/planner-canvas.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas.tsx)
Renders the active binder layout, page navigation, template switching, placed art regions, and card slot grid. This is the main editing surface where users arrange cards and Meechi artwork.

### [frontend/components/planner/inspector-sidebar.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/inspector-sidebar.tsx)
Shows slot details, theme controls, and selected Meechi art actions. Its role is contextual editing and customization for the currently selected page element.

### [frontend/components/planner/crop-modal.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/crop-modal.tsx)
Provides the modal workflow for configuring uploaded artwork spans, crop offsets, zoom, and fit mode. It handles the interactive Meechi placement preview before artwork is committed to the page.

## Planner State and Hooks

### [frontend/hooks/use-planner-state.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-planner-state.ts)
Composes the specialized planner hooks into a single interface consumed by the UI. Its role is coordination rather than owning detailed business logic itself.

### [frontend/hooks/use-catalog-data.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-catalog-data.ts)
Handles fetching sets and cards from the separate backend service, along with search state and loading and error state. It owns the planner's catalog data flow.

### [frontend/hooks/use-layout-manager.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-layout-manager.ts)
Manages binder layouts, pages, selected slots, persistence, theme updates, and drag and drop placement. It is the main state manager for binder editing and local save behavior.

### [frontend/hooks/use-art-placement.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-art-placement.ts)
Encapsulates image upload, crop draft state, art region validation, and placement, edit, and delete logic. Its role is to isolate the Meechi-specific workflow from the broader layout manager.

## Shared Frontend Logic

### [frontend/lib/types.ts](C:/Users/natha/one-piece-binder/frontend/lib/types.ts)
Defines the shared TypeScript domain models for cards, sets, themes, layouts, pages, assets, and art regions. It provides the common type contract across the planner, hooks, and API layer.

### [frontend/lib/planner.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner.ts)
Contains planner-specific constants and utility functions such as template lookup, slot helpers, local storage keys, and asset conversion. Its role is shared planner infrastructure that should not live inside React components.

### [frontend/lib/catalog-sample.ts](C:/Users/natha/one-piece-binder/frontend/lib/catalog-sample.ts)
Provides a local fallback sample catalog for development or API failure cases. It ensures the planner can still function when the external card source is unavailable.

### [frontend/lib/api-client.ts](C:/Users/natha/one-piece-binder/frontend/lib/api-client.ts)
Provides typed frontend wrappers for calling the separate backend service. Its role is to keep raw endpoint strings and request mechanics out of the React hooks and UI components.

## Backend Service

### [backend1/requirements.txt](C:/Users/natha/one-piece-binder/backend1/requirements.txt)
Lists the Python packages required to run the active backend service: FastAPI, Uvicorn, and HTTPX.

### [backend1/.env.example](C:/Users/natha/one-piece-binder/backend1/.env.example)
Documents the Python backend environment variables for local development, including port, allowed frontend origin, and the OPTCG API base URL.

### [backend1/app/main.py](C:/Users/natha/one-piece-binder/backend1/app/main.py)
Defines the FastAPI application, CORS policy, and the public HTTP routes used by the frontend for health, sets, cards, search, and market price lookups.

### [backend1/app/config.py](C:/Users/natha/one-piece-binder/backend1/app/config.py)
Loads normalized runtime configuration for the Python backend from environment variables.

### [backend1/app/models.py](C:/Users/natha/one-piece-binder/backend1/app/models.py)
Defines the Pydantic validation models for upstream OPTCG API payloads and the normalized response models returned to the frontend.

### [backend1/app/optcg_client.py](C:/Users/natha/one-piece-binder/backend1/app/optcg_client.py)
Handles all live OPTCG API calls, caches results with TTLs, and normalizes raw set and card data into the frontend-facing contract without using hardcoded catalog fixtures.

### [backend1/app/cache.py](C:/Users/natha/one-piece-binder/backend1/app/cache.py)
Implements the Python backend's lightweight in-memory TTL cache used to reduce repeated upstream API calls.
