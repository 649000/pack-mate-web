## Context

See `proposal.md` — Why.

Current state:

- The token base (`app/globals.css`) and 16 UI primitives in `components/ui/` were already copied from the Metronic starter kit (the primitives differ only in formatting).
- No layout chrome exists: `components/app-shell.tsx` is a hand-written top bar and `app/layout.tsx` has no chrome. The reference ships 39 sidebar layouts under `components/layouts/layout-N/`.
- The landing page (`app/page.tsx`) is a hand-written 30-line placeholder. The reference landing (`metronic-tailwind-nextjs-landings/saas`) is a complete marketing site with 12 section components, its own UI set, two animation components and 57 image assets.
- The reference lives in `reference/`, which is gitignored. It is readable on this machine but absent from clones and CI.
- The app is a static Next.js export (`output: 'export'`), client-rendered behind auth, with the landing public.

## Goals / Non-Goals

**Goals:**

- Give the authenticated app a real Metronic layout shell (sidebar and header), responsive down to mobile.
- Replace the placeholder landing with the full SaaS marketing template.
- Reuse the existing token base and primitives so the look is consistent.
- Keep the paid template source out of the repository.

**Non-Goals:**

- No backend, database, authentication or RLS changes.
- No brand colour decision; the template's default appearance is adopted and colour is refined later.
- Not porting all 39 reference layouts; one shell is adopted and adapted.
- Not porting reference demo pages unrelated to Pack Mate.

## Decisions

### Port one reference shell and adapt it, rather than all layouts or none

**Why:** The reference's layouts are enterprise dashboards. Pack Mate needs one coherent shell. `layout-1` provides sidebar, header, toolbar, breadcrumb and mobile menu, and depends only on `lucide-react`, `next` and `react` — all already present, so no new dependencies for the shell.

**Alternative — port several layouts:** unnecessary variety, more code to maintain. **Alternative — build custom chrome:** rejected; the goal is fidelity to the template.

### Sidebar collapses to a drawer below the large breakpoint

**Why:** The product is mobile-first (`AGENTS.md`). A permanent sidebar is a desktop pattern; below `lg` the navigation becomes a trigger-opened drawer, matching the reference's own responsive behaviour. This resolves the tension between "enterprise dashboard" chrome and mobile-first use.

### Port the landing sections wholesale

**Why:** The landing is a complete marketing experience; recreating it in-house would diverge from the template and lose the animation and layout work. Sections are ported with their supporting UI, animation components and referenced assets, and copy is adapted to Pack Mate.

**Alternative — trim to a few sections:** rejected; the requirement is full use of the template.

### Adopt the template's default appearance now; defer colour

**Why:** Colour is explicitly deferred. The app keeps the neutral Metronic token base; the landing keeps the template's own token set (indigo/rainbow accents). Re-branding is a token change later and does not affect structure.

### Add the dependencies the landing requires

**Why:** The landing imports `framer-motion`, `motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `canvas-confetti` and `vaul`. Porting faithfully is cheaper and less risky than rewriting sections to avoid them. `radix-ui`, `next-themes`, `sonner`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge` and `tw-animate-css` are already present.

**Trade-off:** added bundle weight on the public landing. Acceptable: the landing is static and the bundle check still guards against secrets.

### Derived code is committed; template source stays gitignored

**Why:** The licence permits use in an end product but not redistribution of the template source. `reference/` remains ignored and only derived application code is committed.

## Risks / Trade-offs

- **Enterprise-dashboard feel conflicts with a mobile-first consumer product** → adopt one responsive shell, drawer on mobile, and keep the consumer-focused screens.
- **Licensing ambiguity for derived code** → keep the template source out of the repository and confirm the licence permits derived code in an end product before release.
- **Static export constrains the landing** → `output: 'export'` means `next/image` needs `unoptimized: true` and interactive sections must be client components; verify the landing builds statically.
- **Landing dependency and asset weight** → include only referenced assets and keep the existing bundle check in CI.
- **Porting drift as the reference is not in CI** → capture the design intent in the spec and this change so future work does not depend on the local reference being present.

## Migration Plan

1. Add the landing dependencies.
2. Port the shell and wire it into `app/layout.tsx`; remove the per-page `AppShell` usage.
3. Port the landing sections, UI, animation components and referenced assets; wire CTAs to `/sign-in`.
4. Update end-to-end tests for the new chrome and landing.
5. Deploy through the existing CI pipeline; rollback is redeploying the previous build.

## Open Questions

- Which exact brand colour to adopt — deferred by the user; a token change once chosen.
