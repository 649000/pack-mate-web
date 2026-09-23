## Why

The app's visual language comes from a licensed Metronic template whose layout shell, token base and data-grid presentation are now the wrong fit. The product's design direction lives in the Stitch project "Pack Mate Travel Organizer", which defines two design systems — **Kinetic Utility** (light, Cerulean consumer SaaS) and **Kinetic Manifest** (dark, tactical/offline) — a horizontally navigated shell, a mobile bottom-tab shell, and a new marketing landing page. None of that is reflected in the code.

This change adapts the existing Pack Mate features to the Stitch design. It is a redesign, not a feature change: no new domain model, capabilities, backend, authentication or RLS behaviour.

## What Changes

- Replace the Metronic visual system with the Stitch one across the whole app: adopt Kinetic Utility for light mode and Kinetic Manifest for dark mode, including their colour tokens, typography (Plus Jakarta Sans, Inter, JetBrains Mono for numerics), radii and elevation.
- Replace the Metronic sidebar shell with Stitch's responsive navigation: a horizontal top nav on desktop (Dashboard, Trips, Bag Library, Items Library, Shared Links, global search, New trip, theme/account) and a top app bar with a bottom tab bar on mobile (Dashboard, Trips, Bags, Items; Account and Shared Links from the app bar).
- Add a presentation-only Dashboard home at `/dashboard` that composes existing trip data (progress, weights, upcoming trips) — read-only, with no new writes, queries or domain concepts.
- Restyle every existing surface (trips, bags, items, shared links, trip packing list, account, sign-in, reset, public share) to the Stitch system while preserving their current behaviour, including the mobile trip view's tabbed `All / To Pack / Packed / With Me` presentation.
- Add presentational 404 and 500 pages in the Stitch style.
- Rebuild the public landing page to the new Stitch landing design while keeping its marketing role and its `/sign-in` calls to action.
- Remove the Metronic layout shell and the components, styles and assets that only it used.

## Capabilities

### New Capabilities

<!-- None. This is a visual redesign of existing behaviour. -->

### Modified Capabilities

- `design-system`: the shell, page chrome, themes, content surfaces and landing page follow the Stitch design systems; navigation is a top nav on desktop and bottom tabs on mobile; light and dark themes are both defined; a read-only signed-in summary surface and presentational error pages exist.

## Impact

- **Frontend**: `app/` (all pages, layouts, landing, new dashboard and error pages), `components/` (layouts, ui primitives, packing, account, share, landing) and `app/globals.css`.
- **Dependencies**: adds `next/font` typefaces only; no new runtime dependency is expected. Metronic-only presentation code is removed.
- **Navigation**: the signed-in home becomes `/dashboard`; redirects after sign-in point there.
- **Tests**: page tests and end-to-end tests updated for the new chrome, labels and shell.
- **Unchanged**: no backend, database, authentication, RLS, PDF export, sharing or domain-behaviour changes. The `reference/` Metronic source stays out of the repository.
