## Why

The app was built to the functional spec only. The paid Metronic template intended to define its visual language was never captured in any artifact, so only its tokens and a handful of UI primitives were adopted. The result is a functional but visually incomplete app, and a landing page that is a hand-written placeholder rather than the full SaaS marketing site the template provides.

## What Changes

- Adopt the Metronic visual system across the whole app: port a Metronic layout shell (responsive sidebar and header) and apply it to every authenticated page.
- Replace the hand-written landing page with the full Metronic SaaS landing template: header, hero, trusted brands, how it works, features, testimonials, pricing, FAQ, call to action, contact and footer.
- Port the supporting UI, animation and marketing components, plus the public assets, that the landing requires.
- Keep the Metronic token base; adopt the template's default appearance now and refine colour later.
- Wire landing navigation and calls to action into the existing sign-in flow.
- Add the dependencies the landing template requires.
- Keep the paid template source itself out of the repository; only derived application code is committed.

## Capabilities

### New Capabilities

- `design-system`: the app shell, page chrome and landing page follow the Metronic visual system, stay usable on mobile and desktop, and are derived from the licensed reference without committing the template source.

### Modified Capabilities

<!-- None. Existing capabilities describe behaviour, which does not change. -->

## Impact

- **Frontend**: `app/` (all pages and the landing), `components/` (app shell, layouts, landing sections, ui/animation components) and `app/globals.css`.
- **Dependencies**: adds `framer-motion`, `motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `canvas-confetti` and `vaul`.
- **Tests**: end-to-end tests updated for the new chrome and landing; unit tests for domain logic are unaffected.
- **Unchanged**: no backend, database, authentication or RLS changes.
- **Licensing**: the template source stays gitignored; only derived application code is committed.
