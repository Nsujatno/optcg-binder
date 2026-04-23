# One Piece TCG Binder Planner PRD

## Summary

Build a desktop-first Next.js web app for One Piece TCG collectors to design binder layouts interactively. The core value is a flexible binder editor with drag-and-drop card placement, customizable binder and page styling, and first-class Meechi-style multi-slot image inserts.

The first release prioritizes:

- fast interactive planning
- local persistence without accounts
- low-cost API-backed catalog browsing
- custom multi-slot art workflows

The first release does not require:

- authentication
- cloud sync
- real-time prices
- public sharing
- print-perfect export

## Product Goals

- Users can browse One Piece sets and cards quickly.
- Users can drag cards into binder slots and rearrange them.
- Users can switch between multiple binder grid formats such as `1x1`, `2x2`, `3x3`, and `4x4`.
- Users can customize binder/page visuals.
- Users can upload custom art, assign a valid multi-slot span, crop it, and place it using the Meechi method.
- Users can save layouts locally and continue later without creating an account.

## Core User Stories

- As a collector, I can browse sets and cards so I can plan a binder by set.
- As a collector, I can drag cards into slots and reorganize them visually.
- As a collector, I can choose different binder grid formats depending on my physical binder.
- As a collector, I can customize binder colors/backgrounds to match my collection style.
- As a collector, I can upload custom art and span it across multiple slots.
- As a collector, I can crop and position uploaded art before placing it.
- As a collector, I can save my layouts locally and return later on the same device.

## v1 Scope

### Catalog

- Set browser
- Card browser
- Text search/filtering
- Market price display from cached API data
- Metadata-first loading with lazy image loading

### Planner

- Binder templates: `1x1`, `2x2`, `3x3`, `4x4`
- Multi-page layouts
- Drag card into slot
- Swap card positions
- Clear slot
- Duplicate page
- Slot selection and basic inspector

### Customization

- Binder background presets
- Page background presets
- Slot border style presets
- Empty slot styling
- Card fit mode support

### Meechi Workflow

- Upload local image
- Choose valid slot span such as `1x2`, `2x1`, `2x2`, `3x2`, etc.
- Crop modal with fill/contain, pan, and zoom controls
- Live preview before placement
- Lock placed art region
- Re-edit art crop later

### Persistence

- Local guest persistence in browser storage
- Autosave
- Rename / duplicate / delete layout
- JSON import/export

## Non-Goals For v1

- Required accounts
- Cross-device sync
- Full collection tracking
- Public layout sharing
- Historical price charts
- Print-ready export fidelity

## Technical Approach

### Frontend

- Next.js App Router
- Desktop-first layout editor
- Client-side drag/drop interactions
- Local browser persistence

### Lightweight Backend

Use Next.js route handlers as the backend-for-frontend layer for v1.

Responsibilities:

- proxy external card data requests
- normalize external card payloads
- cache set/card metadata
- cache market prices for 24 hours
- provide stable internal API contracts to the frontend

### Data Source

Use the external One Piece card API as the primary source when available, with local fallback sample data for resilience during development.

Normalized card fields:

- `id`
- `setId`
- `setName`
- `cardSetId`
- `name`
- `imageUrl`
- `marketPrice`
- `rarity`
- `color`
- `type`
- `cost`
- `power`
- `life`
- `counter`
- `attribute`
- `subTypes`
- `text`
- `scrapedAt`

### Caching Strategy

No database is required for v1.

- Card metadata: in-memory backend cache with TTL
- Market data: in-memory backend cache with 24-hour TTL
- Card images: direct remote URLs plus browser caching
- Layouts: browser local storage

Future escalation path:

- add object storage / CDN proxy if image hotlinking becomes a problem
- add database only when accounts or cloud sync become necessary

## Domain Model

### BinderTemplate

- `id`
- `name`
- `rows`
- `cols`

### ThemeConfig

- `binderBackground`
- `pageBackground`
- `slotAccent`
- `emptySlotStyle`

### SlotPlacement

- `slotId`
- `cardId`

### UploadedAsset

- `id`
- `name`
- `src`
- `width`
- `height`

### ArtRegion

- `id`
- `assetId`
- `originRow`
- `originCol`
- `rowSpan`
- `colSpan`
- `cropX`
- `cropY`
- `zoom`
- `fitMode`
- `locked`

### BinderPage

- `id`
- `placements`
- `artRegions`

### BinderLayout

- `id`
- `name`
- `templateId`
- `theme`
- `assets`
- `pages`
- `createdAt`
- `updatedAt`
- `schemaVersion`

## API Surface

- `GET /api/sets`
- `GET /api/sets/:setId/cards`
- `GET /api/cards/search`
- `GET /api/cards/:cardId/market`

## Implementation Phases

### Phase 1

- Document PRD
- Add shared types
- Build API proxy/cache routes
- Add fallback sample data

### Phase 2

- Build planner shell
- Implement set browser and card list
- Implement binder template switching
- Implement drag/drop slot placement
- Implement local persistence

### Phase 3

- Add theme customization
- Add Meechi image upload/span/crop placement
- Add region locking and editing

### Phase 4

- Improve UX polish
- Add import/export
- Add undo/redo if time allows
- Prepare extension points for accounts and collection tracking

## Test Plan

- Set list loads successfully
- Cards load for a set
- Prices are shown from normalized data
- Drag/drop places and swaps cards correctly
- Invalid drops onto occupied art slots are blocked
- Binder templates render correct grid dimensions
- Theme controls update page visuals
- Uploaded art can only occupy valid contiguous spans
- Crop settings persist after save/reload
- Layout autosave survives refresh
- JSON export/import preserves layout data

## Future Roadmap

- Accounts and cloud saves
- Cross-device sync
- Collection ownership tracking
- Value dashboards and price history
- Public and shareable layouts
- Print/export pipeline
- Mobile/tablet editing improvements
