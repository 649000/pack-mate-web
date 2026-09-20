## Context

See `proposal.md` — Why.

Current state and constraints that shape the approach:

- The authenticated content surfaces (`app/(app)/trips`, `bags`, `items`, `shares`, `trip`) and the public share surface (`app/share`) all use the same plain `components/ui/table.tsx` with text-only cells, text buttons, a `Loading...` line and a one-line empty state.
- `components/ui/*` primitives already in the repository are semantically in sync with the theme reference; they differ only in formatting, class order and RTL variants. They are not to be re-ported.
- The theme reference is `reference/metronic-tailwind-react-starter-kit/typescript/nextjs` (gitignored, absent from CI). Its 39 layout demos are chrome-only — every `layout-N/page.tsx` is a placeholder ending in `<Skeleton />`. There are no content pages to copy; the theme supplies components, and the surfaces must be composed from them.
- The theme ships two table paths: `components/ui/table.tsx` (plain, already present) and the `data-grid*` family (eight files: base context, table, column header, column filter, column visibility, pagination, and two drag-and-drop variants). The `data-grid` family is the theme's data-table component.
- The app is a static Next.js export (`output: 'export'`), client-rendered behind auth, with all records loaded client-side. There is no server pagination to integrate with.
- The product is mobile-first (`AGENTS.md`); the theme's data tables are a desktop pattern.
- The theme's `@remixicon/react` icon set is referenced by exactly one unadopted component (`layout-29/sidebar-primary.tsx`); everything else uses `lucide-react`, which the app already uses.

## Goals / Non-Goals

**Goals:**

- Give each content surface the theme component that fits its feature, copied from the reference and adapted to Pack Mate's data.
- Reuse the already-in-sync primitives and port only the components that are missing.
- Keep every surface usable at mobile and desktop widths.

**Non-Goals:**

- No custom components invented in place of a theme component.
- No porting of the theme's 39 layout variants, or of components the surfaces do not use (`tree`, `chart`, `calendar`, `kanban`, `carousel`, `stepper`, `avatar-group`, `remixicon`).
- No behaviour, data-model, authentication or RLS change.
- No server-side pagination, sorting or filtering; the export is static.

## Decisions

### Choose the theme component per feature rather than one layout for every surface

**Why:** The theme is a component set, not a page set. The surfaces differ: trips, bags, items and shared links are record lists; a trip is a grouped, reorderable checklist; a shared link is a read-only view. Mapping each to the fitting component is what makes the theme appropriate rather than decorative.

```
surface                 theme component                     dependency impact
----------------------  ----------------------------------  -----------------
trips / bags / items /  data-grid family (toolbar, sort,     theme table library
shared links            column header, column visibility,    (+ command palette
                        pagination, icon actions, badges)    for column filter)
trip                    one compact summary strip, one       none
                        action row (add + search), then
                        borderless sections per group with
                        icon headers; rows separated by
                        dividers on the existing sortable
                        list; weight-by-category collapsed
shared trip (public)    card + progress, read-only           none
all                     skeleton, tooltip, breadcrumb        none
```

**Alternative — keep the plain table and restyle:** rejected; it rebuilds the theme's table appearance by hand, diverging from the reference the change is meant to follow.

### Take the data-grid family and the dependency it requires

**Why:** The `data-grid` family is the theme's data table and is written against the theme's table library. Copying the component as written means taking that library, plus the command component the column filter references. This is a requirement of the copied component, not an additional choice.

**Trade-off:** new runtime dependencies. Mitigated by the small, client-only record counts and by keeping the change to one table path.

### Structure a trip as a list with compact chrome, not a stack of cards

**Why:** A packing list is the reason the user opened the trip, so it must dominate the page. An earlier pass gave every element equal weight — summary, adding, search, weight breakdown and each group were all separate bordered cards, and every entry was itself a bordered box inside a bordered card. That produced nine cards around a two-bag list, no visual hierarchy, and the list starting below four cards of chrome.

The trip surface is therefore structured as: one compact summary strip (progress and baggage total together), one action row (add and search), then the list itself as borderless sections — each with an icon, name, packed count and weight in its header, and entries separated by dividers rather than drawn as boxes. Reference detail (weight by category) is collapsed behind a disclosure so it does not compete with the working list. Adding opens a dialog covering the three input modes (library item, library bag, one-off) instead of stacking three forms inline.

**Alternative — keep the cards and only restyle them:** rejected; the problem is the number of equal-weight containers and the nesting, not their styling.

### Keep every group visible rather than behind tabs

**Why:** Packing means moving between bags, so the user needs to see every group at once. Tabs would hide the With Me and unassigned groups and would conflict with the category filter, which is expected to show matching entries across groups.

**Alternative — theme tabs for Bags / With Me / unassigned:** rejected; it hides content the user needs while packing and breaks the cross-group category filter.

### Keep the existing sortable list and the native selects

**Why:** Reordering already works with `@dnd-kit` (a present dependency) and the destination, parent-bag, category and expiry controls are native selects with tested behaviour. The theme's drag-and-drop table rows expect a single table, whereas the packing list is a set of separate sections, and the theme's select is not a native control. Swapping either would restructure working behaviour for a cosmetic gain.

**Trade-off:** these controls keep their existing markup, so they receive the theme's row and input styling rather than the theme's component. Accepted; the visual gain does not justify rewriting tested behaviour.

### Reuse the in-sync primitives; port only what is missing

**Why:** The existing `components/ui/*` already match the theme semantically, so re-porting them would churn formatting for no behaviour change. Only components absent from the repository (`skeleton`, `tooltip`, `tabs`, `breadcrumb`, the `data-grid` family) are ported.

### Keep the existing recursive bag nesting; do not port the theme's tree

**Why:** Bag nesting already renders correctly with a small recursive function in `app/(app)/trip/page.tsx`. The theme's `tree` component adds a dependency for behaviour the app already has.

### Derive imagery from the data model and theme backgrounds, not template images

**Why:** The reference contains no product imagery — only landing assets. Item imagery comes from the existing `image_url` field, with a category representation as fallback; decorative treatment uses the theme's existing background components.

### Adapt tables for small screens

**Why:** Data tables are a desktop pattern and the product is mobile-first. Small screens keep the identifying columns and reach the rest through the table's own controls, so the surface does not become a horizontal scroll or a wall of text.

**Alternative — replace tables with cards below the breakpoint:** rejected; it doubles the presentation code and diverges from the theme.

### Keep the paid template source out of the repository

**Why:** Licence terms permit use in an end product but not redistribution of the template source. `reference/` stays gitignored; only derived code is committed. This preserves the position already taken in `adopt-metronic-ui`.

## Risks / Trade-offs

- **The `design-system` capability is still in flight.** `adopt-metronic-ui` introduces it but has not archived, so this change's delta is written as added requirements. → Land or sync `adopt-metronic-ui` before archiving this change; reconcile the two deltas at that point.
- **Data tables are heavy on mobile.** → Keep identifying columns on small screens, expose the rest through the table's own column controls, and verify at mobile width.
- **Porting drift as the reference is absent from CI.** → Capture the surface-to-component mapping here and in the spec so later work does not depend on the local reference.
- **New dependencies add bundle weight.** → They load only behind authentication, and the existing bundle check still runs in CI.
- **The theme's table library is headless**, so appearance comes from the ported components, not the library. → Verify the ported components render as in the reference before adapting cells.
- **`@remixicon/react` is not adopted.** → Icons continue to come from `lucide-react`, consistent with the rest of the app.

## Migration Plan

1. Port the missing components (skeleton, tooltip, tabs, breadcrumb, data-grid family) and add the dependency they require; verify they render in isolation.
2. Apply them surface by surface, starting with items and bags, keeping existing behaviour and page tests passing.
3. Move the trip surface to tabs and reorderable rows; verify add, assign, With Me, packed, reorder and progress still work.
4. Apply the same components to the public share surface, read-only.
5. Update page tests and verify `npm run verify` passes.
6. Deploy through the existing CI pipeline; rollback is redeploying the previous build.

## Open Questions

- Which brand colour to apply is still deferred from `adopt-metronic-ui` (task 6.2); it is a token change and does not affect this change's structure.
