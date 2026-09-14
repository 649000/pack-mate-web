## 1. Dependencies and setup

- [x] 1.1 Add `framer-motion`, `motion`, `react-hook-form`, `@hookform/resolvers`, `zod`, `canvas-confetti` and `vaul` to `package.json`; verify `npm install` succeeds and `npm run verify` still passes
- [x] 1.2 Configure `next/image` for static export (`unoptimized`); verify the landing can use images and `npm run build` emits `out/`

## 2. Application shell

- [x] 2.1 Port a reference layout shell (sidebar, header, toolbar, breadcrumb, mobile menu) into `components/layouts/`, using only already-present dependencies; verify it renders in isolation
- [x] 2.2 Wire the shell into `app/layout.tsx` and remove the per-page `AppShell` usage; verify every authenticated page (trips, bags, items, trip) renders inside the shared shell
- [x] 2.3 Implement responsive behaviour: persistent sidebar at desktop widths, drawer trigger below the large breakpoint; verify navigation is reachable and there is no horizontal overflow at mobile and desktop widths

## 3. Apply the shell to app pages

- [x] 3.1 Restyle the trips page within the shell; verify create, edit and delete still work and `app/trips/page.test.tsx` passes
- [x] 3.2 Restyle the bags page within the shell; verify default-contents management still works and `app/bags/page.test.tsx` passes
- [x] 3.3 Restyle the items page within the shell; verify create, edit and delete still work and `app/items/page.test.tsx` passes
- [x] 3.4 Restyle the trip/packing-list page within the shell; verify add, assign-to-bag, With Me, packed, reorder and progress still work and `app/trip/page.test.tsx` passes
- [x] 3.5 Restyle the sign-in page to match the shell; verify sign-in still works and `app/sign-in/page.test.tsx` passes

## 4. Landing page

- [x] 4.1 Port the landing sections (header, hero, trusted brands, how it works, features, testimonials, pricing, FAQ, call to action, contact, footer) and their supporting UI and animation components; verify the landing renders every section
- [x] 4.2 Port only the referenced public assets (brands, avatars, screens) and verify there are no broken images
- [x] 4.3 Replace `app/page.tsx` with the template landing and wire navigation and calls to action to `/sign-in`; verify the landing is public and a call to action navigates to sign-in

## 5. Verification

- [x] 5.1 Update end-to-end tests for the new shell and landing; verify `npm run test:e2e` passes at mobile and desktop widths
- [x] 5.2 Verify `npm run verify` passes, including the bundle check and static export
- [x] 5.3 Confirm the paid template source remains untracked (`git ls-files reference/` is empty) and only derived code is committed

## 6. Follow-up (deferred)

- [ ] 6.1 Replace the landing's template screenshots (`public/screens/*.png`, used in the hero and "How it works") with Pack Mate screenshots once available; verify the landing renders the new images with no broken images
- [ ] 6.2 Decide the brand colour and apply it to the token base (currently the template default); verify the app shell, pages and landing still render correctly with the new tokens
- [ ] 6.3 Replace the landing contact form's simulated submit with a real destination, or remove the form; verify a submission reaches the chosen destination
- [ ] 6.4 Review the landing copy for tone and claims before public launch; verify the final copy is approved
- [x] 6.5 Add Profile and Preferences pages, or remove those menu items; verify every user-dropdown item navigates somewhere real or is gone (Profile now opens `/account`; Preferences removed)
- [ ] 6.6 Expand header search beyond navigation destinations (e.g. trips, bags, items); verify a result navigates to the matching record
- [ ] 6.7 Implement real notifications or remove the notifications sheet; verify no dead UI remains in the header
- [ ] 6.8 Port the remaining Metronic header widgets (mega menu, chat, apps) or explicitly decide not to; verify no expected header control is missing
