## Context

See `proposal.md` — Why.

Current state that shapes the approach:

- Three pickers select from the user's own library using native `<select>`: adding a library bag to a trip and adding a library item to a trip (`app/(app)/trip/page.tsx`), and adding an item to a bag's default contents (`app/(app)/bags/page.tsx`).
- The library entries are already loaded into client-side state on each page, so the choices are available without new data access.
- `filterByName` (`lib/packing.ts`) already implements case-insensitive substring matching and is the rule used by list search and the search dialog; it is unit-tested.
- `components/ui/popover.tsx` exists (Radix). There is no `command` primitive and no `cmdk` dependency.
- The app is a client-rendered static export; the pages holding the pickers are already client components.

## Goals / Non-Goals

**Goals:**

- One reusable picker used at all three library selection sites.
- Matching consistent with the rest of the app by reusing `filterByName`.
- Keyboard and touch operation, with no-match and empty states.
- No new dependency.

**Non-Goals:**

- The destination selects on the trip page (trip bags plus Loose/With Me). They choose among trip bags, not library entries, and are a separate, lower-value case.
- Creation suggestions or duplicate-name prevention on the item and bag name fields.
- The topbar search dialog and the list-page filters.
- Any change to what a selection copies.

## Decisions

### Build a small picker on the existing Popover primitive

**Why:** A reusable picker on `components/ui/popover.tsx` plus a text input and a filtered list needs no new dependency, and gives full control over the mobile and keyboard behaviour the spec requires. The alternative — adding `cmdk` with the shadcn Command wrapper — provides filtering and keyboard navigation out of the box but introduces a dependency for a single use, which `AGENTS.md` says to avoid when the existing stack suffices. Native `<datalist>` is the cheapest option but has inconsistent mobile support (notably iOS Safari), no no-match state and no way to show secondary detail; that fails the mobile-first requirement.

### Keep the picker presentation-only and controlled

**Why:** The picker takes the options, the selected value and an `onChange`; the page keeps its existing add handlers and copy semantics. This keeps the existing behaviour of `packing-lists` and `bags` untouched, which is exactly what the change promises. Folding the add flow into the picker would move data-layer logic into a presentation component and duplicate copy semantics.

### Reuse `filterByName` for matching

**Why:** The spec asks for the same case-insensitive substring rule the app already uses elsewhere. One matcher means one behaviour to reason about and test. A separate fuzzy matcher would behave differently from search and is unnecessary.

### Show secondary detail to tell same-named entries apart

**Why:** The main gain over a native select is disambiguation. Where an entry has distinguishing detail (for example an item's category), showing it alongside the name lets a user choose correctly between similarly named entries. This is presentation only and does not affect what is copied.

### Cap the number of rendered matches

**Why:** Rendering an entire large library as rows is wasteful and makes the popover unwieldy. Render a bounded number of matches inside a scrollable area. If real libraries outgrow this, revisit with virtualisation; that is not warranted now.

### Keyboard contract: move, confirm, dismiss

**Why:** The spec requires operation without a pointer. Arrow keys move an active match, Enter confirms it, Escape closes without selecting, and typing resets the active match. The query is preserved when there are no matches so the user can edit it.

### One popover for both mobile and desktop

**Why:** A single interaction is simpler than branching to a bottom sheet on small screens. Radix popovers are touch-operable; if they prove awkward on phones in practice, a `vaul` drawer variant can be added later. A drawer now would duplicate the list and keyboard logic for no proven benefit.

## Risks / Trade-offs

- **Very large libraries make a long result list** → cap rendered matches and scroll; revisit with virtualisation only if needed.
- **Popover placement near the bottom of a scrolling page on mobile** → rely on Radix collision handling and verify at mobile widths during implementation.
- **Existing page tests query the native select's role** → update the affected page tests and add component tests for filtering, keyboard and empty states.
- **A custom control can regress accessibility** → keep an accessible label and expanded state, and verify keyboard-only operation.
- **Duplicate names remain ambiguous even with secondary detail** → accepted; the picker reduces, not eliminates, the problem, and no dedupe behaviour is in scope.

## Migration Plan

No data migration and no schema change. The picker is adopted one site at a time, so each replacement is independently shippable. Rollback is reverting the picker usage at a site; the underlying add handlers are unchanged.

## Open Questions

- Whether the trip destination selects should later adopt the same picker. Deferrable: it needs no spec change and no rework of this picker beyond wiring.
