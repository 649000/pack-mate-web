## Why

Reviewing the redesigned app surfaced three design issues in the Stitch adaptation:

- The Trips surface still uses the Metronic-style data table, while the dashboard's trip cards are the intended, more readable treatment.
- Trips could only be opened through a nested action, not by activating the record itself.
- The shell showed a notifications control for a feature Pack Mate does not have, and the "New trip" action led to the trips list and required a second click to create a trip.

## What Changes

- Present the trips surface as cards (destination, dates, status, secondary actions) instead of a data table, matching the dashboard treatment.
- Make each trip record fully activatable — the whole card opens the trip, with the trip name as the accessible link.
- Remove the notifications control from the shell, since Pack Mate has no notifications.
- Make the shell's "New trip" action open the create-trip dialog directly.
- Increase the layout spacing on the trips, libraries and shared-links surfaces for consistency with the dashboard.

## Impact

- **Frontend**: `app/(app)/trips`, `app/(app)/dashboard`, `components/layouts/top-nav`, `components/layouts/mobile-nav`, `components/layouts/page-header`, `components/layouts/app-shell`, `app/globals.css`; removes `components/layouts/topbar/notifications-sheet.tsx`.
- **Behaviour**: no domain change; the create-trip flow and all trip actions are unchanged, only how they are reached.
- **Tests**: trips page unit tests extended; end-to-end navigation expectations already updated.
- **Unchanged**: no backend, database, authentication or RLS changes.
