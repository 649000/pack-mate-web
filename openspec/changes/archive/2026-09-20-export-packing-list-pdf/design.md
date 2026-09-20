## Context

See `proposal.md` for motivation. The constraints that shape this design:

- The app is a **static Next.js export** (`next.config.ts`: `output: "export"`) hosted on Firebase Hosting. There is no server runtime and no server route available.
- Trip data is already fetched client-side from Supabase (RLS-protected) and fully loaded on the trip page (`app/(app)/trip/page.tsx`), including bags, entries, `is_packed`, `weight_grams` and `category`.
- The read-only presentation of a trip already exists in `components/share/shared-trip-view.tsx`, and the grouping/weight logic lives in reusable helpers: `lib/packing.ts` (`buildBagTree`, `groupEntries`, `packingProgress`) and `lib/weight.ts` (`sumBagWeight`, `tripBaggageTotal`, `formatWeight`).
- The theme uses Tailwind v4 with `oklch()` colours (`app/globals.css`).
- `AGENTS.md` requires Firebase Functions only when genuinely required and warns against cost traps.

## Goals / Non-Goals

**Goals:**

- Produce a pen-tick printable PDF for a trip the user owns, generated entirely in the browser.
- Reuse the existing domain helpers so PDF grouping, nesting, weights and progress agree with the app.
- Keep the dependency out of the trip page's initial bundle.
- Support blank (default) and match-packed-state modes.

**Non-Goals:**

- No interactive PDF form fields, no import or sync back from the PDF.
- No Firebase Function or any server-side rendering.
- No export on the public share page; owner only.
- No images, links or descriptions in the PDF.

## Decisions

### Generate client-side, not in a Firebase Function

**Why:** The trip data is already in the browser and the browser can produce the file without a round-trip. A Function adds a deploy surface, a cold start in front of a one-tap action, and per-invocation cost, which `AGENTS.md` explicitly discourages.

**Alternatives considered:**
- *Function + headless Chromium (Puppeteer)* — would let us reuse the rendered HTML/CSS, but deploys a large Chromium binary, is memory- and CPU-heavy, has multi-second cold starts, and is a cost trap.
- *Function + a Node PDF library* — writes the same manual layout code as the client, plus a function, auth-token verification, a Supabase fetch and a network round-trip for no new capability.

### Use `@react-pdf/renderer`, dynamically imported client-side

**Why:** It expresses the document as React components, which matches the codebase's model; it handles text wrapping and pagination, which the nested-bag layout needs; and it supports React 19 (confirmed peer dependency). The generated PDF has selectable, vector text, satisfying the "real text" requirement.

**Alternatives considered:**
- *jsPDF* — smaller core, but imperative and requires manual pagination and positioning, so more code for nested bags and wrapping.
- *pdf-lib* — lowest level with no wrapping or layout helpers; best suited to form fields, which are out of scope.
- *html2canvas / html2pdf.js* — rejected: this family rasterises the DOM and cannot parse `oklch()` colours, which the theme uses.

**Import strategy:** load the renderer and the generator with a dynamic, client-only import (the same client-boundary pattern the share page uses with `Suspense` + a client component), so it is code-split away from the trip page's initial bundle.

### Reuse domain helpers, not the DOM view

The PDF is a separate presentation, but it consumes the same helpers the shared view uses (`buildBagTree`, `groupEntries`, `sumBagWeight`, `formatWeight`, `packingProgress`) so its grouping, nesting and totals cannot drift from the app. `SharedTripView` itself is not reused because it renders web DOM, not PDF primitives.

### Mode is a single boolean; blank is the default

The generator takes a `tickPacked: boolean` (or equivalent). In blank mode every checkbox renders empty. In match mode, `is_packed` fills the box. This keeps the generator pure and unit-testable.

### Omit images, links and descriptions

Images and links are excluded because they are useless or wasteful on paper. Descriptions are also excluded to keep the sheet a focused ticking list; the entry name, quantity and category carry the identifying information. **Flagged for confirmation** — the user asked only to omit images and links.

### Respect the current weight unit

The PDF renders weights using the unit currently selected on the trip page (kg/lb), matching what the owner sees on screen.

### Trigger via a small mode-selection dialog next to Share

The trip page header already holds the Share action (`app/(app)/trip/page.tsx`). A "Download PDF" action sits beside it and opens a dialog offering the two modes, then triggers generation and download. Reusing the existing dialog primitive keeps the interaction consistent with the app.

### Filename

`pack-mate-<trip-name>.pdf`, slugified and with unsafe filename characters removed, ending in `.pdf`.

## Risks / Trade-offs

- **Bundle size** → the renderer is sizable; mitigated by dynamic, client-only import so it loads only when the user exports.
- **Parallel styling** → `@react-pdf/renderer` has its own layout engine and ignores Tailwind classes; the PDF styles are a small, self-contained style block colocated with the generator.
- **Page breaks inside a bag** → long bags could split awkwardly; mitigate by marking each bag group to avoid breaking where the renderer allows.
- **Duplication risk** → PDF content could drift from the app; mitigated by consuming the shared helpers rather than re-deriving grouping and weights.
- **Mobile download behaviour** → a Blob download is reliable on Android Chrome; on iOS Safari it may open in the viewer rather than Files. Acceptable for a v1 and still a better flow than the print dialog.
- **Renderer peer/SSR issues** → it must never be evaluated during static prerender; enforced by the client-only dynamic import.

## Migration Plan

No data migration. Add the dependency, ship the generator and UI, and deploy through the existing CI pipeline. Rollback is removing the button and the dependency; no persisted state changes.

## Open Questions

None that block the task breakdown. The description-omission decision above is the one item to confirm with the user before implementation.
