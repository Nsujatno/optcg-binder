# Planner QoL UI Restructuring PRD

## Problem Statement

The planner UI works, but the current interaction model makes the editing surface feel heavier than it needs to. The left catalog sidebar permanently occupies space even though card selection already finishes in a modal workflow. Global binder actions are split between the header menu and other areas, which makes them harder to discover and gives the application multiple competing homes for the same commands. Slot-level actions are also inconsistent: some actions require selecting a slot first, while other actions are hidden behind different UI patterns.

From the user’s perspective, this leads to three quality-of-life problems:

- the canvas has less room than it should because the catalog is always visible
- global binder actions are not grouped into one obvious place
- slot actions are not lightweight enough for common tasks like adding a card, uploading Michi art, removing a card, or editing placed art

The desired outcome is a cleaner planner shell that keeps the binder canvas more prominent, consolidates global actions into a single left-side action rail, and makes slot-level actions more direct without removing the existing inspector-based editing model.

## Solution

Replace the current left catalog sidebar with a compact, top-aligned, icon-only left action rail. This rail will contain five global planner actions: add card, clear page, download screenshot, export JSON, and import JSON. Each action will have a lightweight hover tooltip.

Move card discovery into a redesigned catalog modal that becomes the single entry point for adding cards. The modal will support two placement modes:

- bulk mode when opened from the left action rail, allowing multi-select and explicit confirmation to fill the next empty slots on the active binder page
- single-slot mode when opened from a specific empty slot, allowing a card click to place the selected card directly into that slot and close the modal immediately

Keep the existing right-hand inspector behavior on selection. Add lightweight slot hover overlays so common actions can be performed directly on the planner canvas:

- empty slot: add card and add image
- slot with a placed card: remove card
- slot occupied by Michi art: remove image and edit image

Add a clear-page confirmation modal that removes both card placements and Michi art regions from the active page, then leaves the user on the same page with selection reset to the first slot.

This change is intentionally limited to QoL restructuring. Binder-scale tuning to better fit a 3x3 layout on a standard laptop at 100% zoom is explicitly deferred.

## User Stories

1. As a binder planner user, I want the left side of the application to use a compact action rail instead of a persistent catalog, so that the canvas feels cleaner and less crowded.
2. As a binder planner user, I want global binder actions grouped in one place, so that I do not have to remember whether an action lives in the header or elsewhere.
3. As a binder planner user, I want the left action rail to be icon-only, so that the UI stays visually light.
4. As a binder planner user, I want each rail icon to show a tooltip on hover, so that I can understand the action without guessing.
5. As a binder planner user, I want the action rail aligned to the top of the planner shell, so that it feels stable and consistent with the rest of the layout.
6. As a binder planner user, I want a dedicated add-card action in the left rail, so that card discovery starts from a single obvious place.
7. As a binder planner user, I want clicking the left-rail add-card action to open a catalog modal, so that I can browse and add cards without a permanent sidebar.
8. As a binder planner user, I want the catalog modal to include a search field at the top, so that I can search directly for a card name.
9. As a binder planner user, I want the catalog modal to include a set list on the side, so that I can browse cards by set.
10. As a binder planner user, I want the main area of the catalog modal to show cards for the current set or search, so that browsing and selection happen in one place.
11. As a binder planner user, I want the catalog modal to start empty, so that I am prompted to choose a set or search rather than loading unrelated cards by default.
12. As a binder planner user, I want the modal’s empty state to clearly say that I can choose a set or search for a card, so that the workflow is obvious on first open.
13. As a binder planner user, I want selecting a set in the modal to load that set’s cards, so that the modal fully replaces the old catalog sidebar.
14. As a binder planner user, I want pressing Enter in the search field to run a card-name search, so that search behaves predictably.
15. As a binder planner user, I want pressing Escape to close the catalog modal, so that the modal has standard keyboard dismissal behavior.
16. As a binder planner user, I want the catalog modal to reset each time it opens, so that I do not re-enter stale browsing context from a previous task.
17. As a binder planner user, I want the left-rail add-card flow to support selecting multiple cards, so that I can fill a page efficiently.
18. As a binder planner user, I want bulk add-card mode to keep an explicit confirmation button, so that I can review my selections before filling slots.
19. As a binder planner user, I want bulk card placement to continue filling the next available empty slots on the active binder page, so that the existing page-fill workflow is preserved.
20. As a binder planner user, I want an add-card action directly on empty slots, so that I can add a card to a specific position without using the global rail.
21. As a binder planner user, I want slot-initiated add-card flow to open the same catalog modal shell, so that card browsing stays consistent no matter where I start.
22. As a binder planner user, I want slot-initiated add-card flow to behave as a single-slot picker, so that I can place one card into a precise slot quickly.
23. As a binder planner user, I want clicking a card in single-slot mode to place it immediately, so that the targeted placement flow stays fast.
24. As a binder planner user, I want the modal to close immediately after a successful single-slot placement, so that I can return to editing the page without extra steps.
25. As a binder planner user, I want empty slots to show inline actions on hover, so that common actions are visible without requiring a selection-first workflow.
26. As a binder planner user, I want empty slots to continue showing inline actions when selected, so that the controls remain usable on touch or after click selection.
27. As a binder planner user, I want empty slots to show both add-card and add-image actions, so that I can choose the correct type of placement directly from the slot.
28. As a binder planner user, I want the add-card slot action to appear only on empty slots, so that the interaction model stays simple and unambiguous.
29. As a binder planner user, I want the add-image slot action to appear only on empty slots, so that art placement does not conflict with an existing card placement.
30. As a binder planner user, I want a placed card slot to show a remove action on hover, so that clearing a card is a lightweight operation.
31. As a binder planner user, I want a Michi art slot to show remove and edit actions on hover, so that art maintenance is as direct as card maintenance.
32. As a binder planner user, I want Michi art editing from the slot overlay to reopen the existing crop/edit workflow, so that there is one consistent art-editing path.
33. As a binder planner user, I want selecting a slot to continue driving the right-hand inspector, so that the current detailed editing and information panel remains available.
34. As a binder planner user, I want the hover overlays to complement selection rather than replace it, so that I get faster actions without losing the inspector workflow.
35. As a binder planner user, I want a dedicated clear-page action in the left rail, so that resetting a page is easy to find.
36. As a binder planner user, I want clear page to remove both card placements and Michi art regions, so that the page reset truly clears the page.
37. As a binder planner user, I want clear page to require confirmation, so that I do not wipe a page accidentally.
38. As a binder planner user, I want confirming clear page to keep me on the same page, so that I can immediately continue editing that page.
39. As a binder planner user, I want clear page to reset selection to the first slot after completion, so that the page is ready for refilling.
40. As a binder planner user, I want screenshot download to live in the left rail, so that export-like actions are grouped together.
41. As a binder planner user, I want JSON export to live in the left rail, so that data portability actions are easy to find.
42. As a binder planner user, I want JSON import to live in the left rail, so that restore/import actions are easy to find.
43. As a binder planner user, I want the header to stop duplicating download and JSON actions, so that there is one clear home for those commands.
44. As a binder planner user, I want the QoL changes implemented without changing binder scale yet, so that the visual restructuring can land cleanly before separate size tuning.
45. As a future maintainer, I want each left-rail action implemented as a separate component, so that the global action UI is easier to understand, test, and extend.
46. As a future maintainer, I want the left rail grouped in its own module boundary, so that action-rail composition is isolated from unrelated planner layout concerns.
47. As a future maintainer, I want the catalog modal behavior to be context-aware but built on one shared shell, so that bulk placement and single-slot placement do not fork into two incompatible UIs.
48. As a future maintainer, I want page-clearing behavior encapsulated in a dedicated planner operation, so that destructive page resets are explicit and testable.
49. As a future maintainer, I want slot overlay actions to be driven by slot content state, so that empty-slot, card-slot, and Michi-art-slot behaviors remain predictable.
50. As a future maintainer, I want these QoL changes to preserve the current planner domain model where possible, so that the implementation stays surgical rather than turning into a broad refactor.

## Implementation Decisions

- The persistent left catalog sidebar will be removed from the planner shell and replaced with a top-aligned, icon-only left action rail.
- The left action rail will contain five separate actions: add card, clear page, download screenshot, export JSON, and import JSON.
- Each left-rail action will be implemented as its own component, with a dedicated action-rail composition boundary rather than a single monolithic sidebar component.
- The header will no longer expose download, export JSON, or import JSON actions once those actions are moved into the left rail.
- The catalog experience will become modal-first. The modal will absorb the current responsibilities of set browsing and card-name search.
- The catalog modal will use one shared shell for both placement contexts: bulk page-fill mode and single-slot placement mode.
- The catalog modal will render a search input at the top, a set list in a side panel, and a central card-results area.
- The catalog modal will open in a reset state each time rather than remembering the previously viewed set or search.
- The catalog modal’s default central state will be an instructional empty state prompting the user to choose a set or search for a card.
- Set browsing remains ordered and explicit. A set is loaded only after the user selects it inside the modal.
- Card-name search continues to be Enter-submitted rather than live-query on each keystroke.
- Escape will close the catalog modal.
- The add-card action supports two explicit modes.
- Bulk mode is entered from the left rail and preserves the existing multi-select plus explicit confirmation workflow.
- Single-slot mode is entered from an empty slot and places a card immediately into the targeted slot when the user clicks a card.
- Single-slot placement closes the modal immediately after successful placement.
- The bulk-mode placement target remains the next available empty slots on the active binder page.
- Slot overlays are additive to the current selection system; they do not replace the right-hand inspector.
- Slot action visibility will be driven by slot content state.
- Empty slots show add-card and add-image actions.
- Card slots show remove-card action.
- Michi art slots show remove-image and edit-image actions.
- Empty-slot actions will appear on hover and remain available for the selected slot as well.
- The add-card and add-image inline actions will only appear for empty slots.
- Michi art editing from the slot overlay will reuse the existing crop/edit workflow instead of introducing a separate editor.
- Clear page is defined as clearing both card placements and Michi art regions from the active binder page.
- Clear page requires a confirmation modal before mutation is applied.
- After a successful clear-page action, the user remains on the current page and selection resets to the first slot.
- The implementation should prefer deep, testable modules for stateful planner behavior, especially around modal context resolution, page-clearing behavior, and slot action derivation.
- The existing planner domain model should be preserved where possible, with new behavior added through localized planner-state and UI seams instead of unrelated refactors.

## Testing Decisions

- Good tests should validate externally observable planner behavior rather than implementation details such as internal state shape, hook-local variable names, or component decomposition.
- Tests should focus on user-visible outcomes: which actions appear, how modal flows behave, what gets placed or cleared, and whether destructive actions require confirmation.
- The planner state and editor seams should be tested for context-aware card placement behavior, including bulk page-fill mode versus single-slot immediate placement mode.
- The planner state and editor seams should be tested for clear-page behavior, specifically confirming that both card placements and Michi art regions are removed and that selection resets appropriately afterward.
- The catalog modal behavior should be tested for reset-on-open behavior, Enter-submitted search, Escape close behavior, and the distinction between empty-state, set results, and search results.
- Slot overlay behavior should be tested from the user’s perspective: which actions are available for empty slots, card slots, and Michi-art slots.
- Left action rail interactions should be tested for wiring correctness, especially that each icon triggers the expected planner workflow and that tooltips expose the correct labels.
- Header behavior should be tested to ensure download/import/export controls are no longer duplicated there.
- Michi art overlay edit behavior should be tested to ensure it routes back into the existing art-editing flow rather than opening an inconsistent alternative path.
- There is little or no existing first-party product test coverage in the current repository, so this work should establish testing seams rather than rely heavily on prior app-specific examples.
- Where possible, isolated behavior tests should target deep planner logic modules and modal-mode decision logic, with lighter UI tests covering integrated interaction flows.

## Out of Scope

- Resizing the binder canvas so a 3x3 layout fits a standard-size laptop at 100% browser zoom.
- Broader visual redesign outside the QoL changes described here.
- Changes to backend APIs, recommendation contracts, or card-catalog data sources.
- New persistence formats beyond the existing JSON import/export behavior.
- Live-search behavior that queries on each keystroke.
- Mobile-first redesign work.
- Undo/redo, cloud sync, authentication, or unrelated planner feature expansion.

## Further Notes

- The implementation should stay surgical and map each changed line directly to the QoL goals captured in this PRD.
- This PRD intentionally preserves the current inspector-based editing model while adding faster in-canvas actions through hover overlays.
- The catalog modal is the key interaction seam for this change set and should be treated as the single unified entry point for card discovery going forward.
- The left action rail should be designed so additional global binder actions can be added later without collapsing back into a monolithic sidebar.
- Binder-size tuning should be handled as a follow-up once the interaction model and planner shell layout have stabilized.
