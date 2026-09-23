## 1. Trips surface

- [x] 1.1 Present the trips surface as cards showing destination, dates and status, keeping search, create, edit, duplicate and delete; verify `app/(app)/trips/page.test.tsx` passes
- [x] 1.2 Make each trip card fully activatable, with the trip name as the accessible link and the card actions still usable

## 2. Shell

- [x] 2.1 Remove the notifications control from the desktop and mobile shell and delete the unused component
- [x] 2.2 Make the "New trip" action open the create-trip dialog directly via `?new=1`, and cover it with a test

## 3. Spacing

- [x] 3.1 Increase spacing on the trips, libraries and shared-links surfaces and the shell so the layout matches the dashboard

## 4. Verification

- [x] 4.1 Verify typecheck, lint, unit tests, coverage, build, bundle check and e2e pass
- [x] 4.2 Verify `openspec validate refine-trip-surfaces --strict` passes
