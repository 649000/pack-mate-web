## Context

See `proposal.md` — Why.

Current state:

- `app/globals.css` carries a neutral zinc token base with a `.dark` variant, plus Metronic `demo1`/sidebar CSS.
- The shell is a Metronic sidebar (`components/layouts/sidebar*.tsx`, `app-shell.tsx`, `layout-context.tsx`) with a fixed header and a drawer below `lg`. `app/layout.tsx` loads only Inter.
- Content surfaces use Metronic primitives, including the `components/ui/data-grid*` family.
- The landing (`app/page.tsx`) is the Metronic SaaS marketing template.
- The app is a static Next.js export (`output: 'export'`), client-rendered behind auth, with the landing public.

Design source: the Stitch project "Pack Mate Travel Organizer" (`projects/10753239031845447359`) with two design systems, **Kinetic Utility** (light) and **Kinetic Manifest** (dark), and screens for Dashboard, Trips, Bag Library, Trip packing list, Account, Sign-in, Reset, 404, 500, plus desktop and mobile variants and a landing page.

## Goals / Non-Goals

**Goals:**

- Adopt the Stitch visual systems in both light and dark mode.
- Replace the sidebar shell with the Stitch responsive navigation (top nav on desktop, bottom tabs on mobile).
- Present every existing surface in the Stitch language without changing its behaviour.
- Give the signed-in app a read-only summary home that composes existing data.
- Rebuild the landing to the new Stitch design.
- Remove Metronic chrome and unused derived code.

**Non-Goals:**

- No new capabilities, domain model, persistence, backend, authentication or RLS behaviour.
- No Stitch features that Pack Mate does not already have: offline sync, readiness scores, suggested gear, pack templates, distance planned, weight budgets, telemetry, or the "manifest" vocabulary.
- No change to what any screen does; only how it looks and is laid out.
- Not adopting Stitch's desktop-only content that has no Pack Mate equivalent.

## Decisions

### Implement both Stitch design systems as one token layer

**Why:** Kinetic Utility (light) and Kinetic Manifest (dark) are two palettes of the same product. `app/globals.css` defines `:root` (Kinetic Utility) and `.dark` (Kinetic Manifest) using the same semantic token names, so every component is written once against semantic tokens and themes automatically. `next-themes` already toggles the `.dark` class, so no new theming mechanism is introduced.

Token mapping:

| Semantic token | Light (Kinetic Utility) | Dark (Kinetic Manifest) |
| --- | --- | --- |
| canvas / background | `#F8FAFC` | `#0B0F17` |
| card / surface | `#FFFFFF` | `#151E2E` |
| well / muted surface | `#F1F5F9` | `#182234` |
| border | `#E2E8F0` | `#1F293D` |
| border strong | `#CBD5E1` | `#334155` |
| text primary | `#0F172A` | `#F9FAFB` |
| text secondary | `#475569` | `#CBD5E1` |
| text muted | `#94A3B8` | `#94A3B8` |
| primary | `#2563EB` | `#3B82F6` |
| primary hover | `#1D4ED8` | `#60A5FA` |
| packed | `#0D9488` | `#10B981` |
| with-me | `#4F46E5` | `#818CF8` |
| pending | `#64748B` | `#94A3B8` |
| warning | `#F59E0B` | `#F59E0B` |

The dark values are taken from the rendered dark screens and the Kinetic Manifest prose (canvas tiers `#0B0F17`/`#111827`/`#151E2E`/`#182234`/`#1E293B`), which match the screens more closely than the generated `designMd` colour list; the mapping is recorded here so it is not re-derived.

### Add the two typefaces and a numeric face

**Why:** Stitch pairs **Plus Jakarta Sans** (headlines) with **Inter** (body/labels), and Kinetic Manifest uses **JetBrains Mono** for numeric values (weights, counts). These load through `next/font/google`, consistent with the existing Inter loading, and are exposed as `--font-heading`, `--font-sans` and `--font-mono`. Numeric values use a tabular-numeral utility so counts do not jitter when toggled.

### Replace the sidebar shell with Stitch navigation

**Why:** The Stitch shell is not a sidebar. Desktop uses a horizontal top nav; mobile uses a compact app bar with a bottom tab bar. `components/layouts/app-shell.tsx` is rewritten, the `sidebar*` and `layout-context` files are deleted, and the existing search, notifications and user-menu controls are kept and restyled. The theme toggle in the user menu stays.

Navigation mapping:

- Desktop top nav: Dashboard, Trips, Bag Library, Items Library, Shared Links, plus global search, "New trip" and account.
- Mobile bottom tabs: Dashboard, Trips, Bags, Items; Account/Settings and Shared Links live in the top app bar menu.

### Keep Pack Mate vocabulary; borrow only Stitch's visuals

**Why:** The domain model in `AGENTS.md` uses Trip, Packing list, Bag and With Me. Stitch's "manifest", "telemetry" and "readiness" are marketing/UI labels for concepts with no Pack Mate equivalent or with an existing name. Using them would misrepresent the data model and violate the "clear mental model" principle. Only layout, colour, type, iconography and component treatment are adopted.

### The dashboard is a read-only composition of existing data

**Why:** Stitch places a Dashboard at the home route. To add no feature, `/dashboard` reads only what existing screens already read — `listTrips`, `departureCountdown`, `packingProgress`, `weightByCategory`, `tripBaggageTotal`, `sumBagWeight` — and renders a summary: active trips, the next journey, packing progress and weight against bag limits, and upcoming trips. It performs no writes and introduces no new queries or domain concepts. Sign-in redirects to it because it is now the home route.

### Replace the Metronic data-grid presentation, keep the table behaviour

**Why:** The `data-grid*` family is Metronic presentation. The list surfaces still need search, sorting and column visibility (existing requirements). Those behaviours come from `@tanstack/react-table`, which is independent of the presentation layer. The grid is restyled to the Stitch row treatment and the unused Metronic chrome is dropped, so the required behaviour survives without the template's look.

**Alternative — keep `data-grid*` and restyle it:** rejected; it is exactly the Metronic surface being replaced.

### Rebuild the landing to the Stitch design

**Why:** The Stitch project contains a new landing design. It replaces the Metronic landing section-for-section while keeping the page's marketing role and its `/sign-in` calls to action. Metronic-only landing components and assets that are no longer referenced are removed.

### Derived code is committed; third-party template source stays out

**Why:** The Metronic reference is already gitignored in `reference/` and is being dropped; no Stitch source is committed either. Only derived application code is committed.

## Risks / Trade-offs

- **Breadth of the change** → keep each surface's handlers and data calls intact and change only markup/classes/layout; verify surface by surface.
- **e2e and page tests depend on existing accessible names** → preserve `aria-label` and roles where practical and update tests deliberately where the chrome genuinely changes.
- **A dark palette with two source values** → implement from the rendered screens, documented in the table above.
- **Static export constrains fonts/images** → `next/font` is static-export safe; keep image `unoptimized`; watch the bundle check.
- **Removing Metronic code could break an unseen reference** → search the repository for each removed module before deleting and typecheck/lint/build after.

## Migration Plan

1. Land the token base, fonts and shell.
2. Restyle the primitives and the list surfaces.
3. Restyle the trip, account, auth and share surfaces.
4. Add the dashboard and the error pages.
5. Rebuild the landing.
6. Remove Metronic leftovers, update tests and run the full verification.

Rollback is redeploying the previous build, since no data or backend changes are involved.

## Open Questions

- None. Brand colour, dark mode, dashboard inclusion, mobile tab routes and landing scope were confirmed.
