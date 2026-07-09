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
This is the top-level client composition component for the planner experience. It now composes the left action rail, planner canvas, right-side inspector/layout controls, the unified catalog modal, and the clear-page confirmation flow.

### [frontend/components/planner/planner-header.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-header.tsx)
Renders the lightweight global application header title bar. Import/export/download actions were moved out of the header into the left action rail.

### [frontend/components/planner/catalog-sidebar.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/catalog-sidebar.tsx)
Legacy catalog sidebar component retained in the repository, but no longer mounted in the current planner shell after the QoL action-rail and modal-first catalog migration.

### [frontend/components/planner/action-rail/index.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/action-rail/index.tsx)
Defines the left global action rail composition module. It groups add card, clear page, screenshot download, JSON export, and JSON import into a compact icon rail.

### [frontend/components/planner/action-rail/actions.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/action-rail/actions.tsx)
Defines the individual left-rail action components. Each action is split into its own module-level component for maintainability and future extension.

### [frontend/components/planner/action-rail/action-button.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/action-rail/action-button.tsx)
Defines the shared left-rail icon button primitive and in-app hover tooltip surface used instead of native browser title tooltips.

### [frontend/components/planner/planner-canvas/index.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/index.tsx)
Acts as the planner canvas composition module. It computes page sizing and totals, mounts the page navigation module, and composes the Michi art layer and card slot grid into the main editing surface.

### [frontend/components/planner/planner-canvas/navigation.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/navigation.tsx)
Defines the planner canvas page navigation module. It owns the previous and next page controls shown around the active binder page.

### [frontend/components/planner/planner-canvas/art-layer.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/art-layer.tsx)
Defines the planner canvas Michi art layer module. It renders placed art regions, selection state, drag behavior, and region deletion controls.

### [frontend/components/planner/planner-canvas/slot-grid.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/planner-canvas/slot-grid.tsx)
Defines the planner canvas slot grid module. It renders card slots, card drag/drop behavior, and slot-state-aware hover overlays: empty-slot add-card/add-image actions, card-slot remove action, and art-slot edit/remove actions.

### [frontend/components/planner/inspector-sidebar.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/inspector-sidebar.tsx)
Shows slot details, theme controls, and selected Michi art actions. Its role is contextual editing and customization for the currently selected page element.

### [frontend/components/planner/crop-modal.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/crop-modal.tsx)
Provides the modal workflow for configuring uploaded artwork spans, crop offsets, zoom, and fit mode. It handles the interactive Michi placement preview before artwork is committed to the page.

### [frontend/components/planner/set-cards-modal.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/set-cards-modal.tsx)
Defines the unified catalog modal shell used for both bulk page-fill mode and targeted single-slot mode. It includes set selection, Enter-submitted name search, reset-on-open behavior, and Escape-close behavior.

### [frontend/components/planner/clear-page-modal.tsx](C:/Users/natha/one-piece-binder/frontend/components/planner/clear-page-modal.tsx)
Defines the clear-page confirmation modal. It confirms destructive page reset operations before clearing both card placements and Michi art regions from the active page.

## Planner State and Hooks

### [frontend/hooks/use-planner-state.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-planner-state.ts)
Composes the specialized planner hooks into a single interface consumed by the UI. Its role is coordination rather than owning detailed business logic itself.

### [frontend/hooks/catalog/index.ts](C:/Users/natha/one-piece-binder/frontend/hooks/catalog/index.ts)
Acts as the catalog composition hook. It combines the catalog fetch module with the catalog modal module into the planner-facing catalog interface.

### [frontend/hooks/catalog/fetch.ts](C:/Users/natha/one-piece-binder/frontend/hooks/catalog/fetch.ts)
Defines the catalog fetch module. It owns set loading, per-source card caching, loading state, error reporting, and the backend fetch adapters for set cards and name-search results.

### [frontend/hooks/catalog/modal.ts](C:/Users/natha/one-piece-binder/frontend/hooks/catalog/modal.ts)
Defines the catalog modal module. It owns modal mode resolution (bulk vs single-slot), modal reset-on-open behavior, active source state, and the modal set/search loading flows.

### [frontend/hooks/use-layout-manager.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-layout-manager.ts)
Acts as the React seam for binder editing. It wires planner editor modules to React state, persistence effects, and UI-facing actions for layouts/pages/slots, including clear-page and direct clear-slot-by-id operations used by slot hover overlays.

### [frontend/hooks/use-art-placement.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-art-placement.ts)
Encapsulates image upload, crop draft state, art-region validation, and placement/edit/delete logic. It now also exposes region-by-id edit entry used by slot hover overlay edit actions.

### [frontend/hooks/use-slot-recommendations.ts](C:/Users/natha/one-piece-binder/frontend/hooks/use-slot-recommendations.ts)
Owns the `What matches here?` UI flow for empty slots on eligible pages. It builds the current page context, calls the backend recommendation endpoint, manages the open/close state of the recommendation panel, and applies a chosen suggestion into the selected slot.

## Shared Frontend Logic

### [frontend/lib/types.ts](C:/Users/natha/one-piece-binder/frontend/lib/types.ts)
Defines the shared TypeScript domain models for cards, sets, themes, layouts, pages, assets, and art regions. It provides the common type contract across the planner, hooks, and API layer.

### [frontend/lib/planner.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner.ts)
Contains planner-specific constants and utility functions such as template lookup, slot helpers, local storage keys, and asset conversion. Its role is shared planner infrastructure that should not live inside React components.

### [frontend/lib/planner-layout-editor.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner-layout-editor.ts)
Defines the planner layout editor module for binder mutations. It owns pure layout/page/slot/theme/import/export/card-snapshot operations, including dedicated clear-page mutations that reset both placements and art.

### [frontend/lib/planner-layout-selectors.ts](C:/Users/natha/one-piece-binder/frontend/lib/planner-layout-selectors.ts)
Defines the planner layout selector module. It owns derived planner lookups such as active layout selection, occupied art slots, available slots, template validation maps, and placement-backed card resolution.

### [frontend/lib/catalog-sample.ts](C:/Users/natha/one-piece-binder/frontend/lib/catalog-sample.ts)
Provides a local fallback sample catalog for development or API failure cases. It ensures the planner can still function when the external card source is unavailable.

### [frontend/lib/api-client.ts](C:/Users/natha/one-piece-binder/frontend/lib/api-client.ts)
Provides typed frontend wrappers for calling the separate backend service. Its role is to keep raw endpoint strings and request mechanics out of the React hooks and UI components, including the AI slot recommendation request.