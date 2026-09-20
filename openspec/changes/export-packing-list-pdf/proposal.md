## Why

Travellers often pack somewhere without reliable signal and want a paper checklist they can tick off with a pen. Today a packing list only exists on screen, and the public share page requires a connection to view. A downloadable PDF gives the user an offline, printable copy of the trip they are packing.

## What Changes

- Add a **Download PDF** action to the trip page, next to Share, available to the trip's owner.
- Generate a printable packing-list PDF in the browser with real text (pen-tick checkboxes, not interactive form fields).
- Offer two modes: a **blank sheet** (every box empty, the default) and **tick packed items** (boxes filled for entries already marked packed in the app).
- The PDF includes the trip name and dates, bags nested as in the app, each entry's name, quantity and category, per-bag weight against its limit, the With Me group and the unassigned group.
- Omit entry images and links from the PDF.
- The empty packing list still produces a valid PDF with an empty state.
- No backend: generation is client-side. No Firebase Function is added.

## Capabilities

### New Capabilities

- `pdf-export`: Generating a printable, pen-tick packing-list PDF for a trip the user owns, in blank or match-packed-state mode.

### Modified Capabilities

- None.

## Impact

- **New dependency**: `@react-pdf/renderer` (client-side, dynamically imported so it stays out of the trip page's initial bundle). Confirmed React 19 support.
- **New code**: a PDF generator module and a small mode-selection dialog, wired to a button on `app/(app)/trip/page.tsx`.
- **Data**: no schema change. Uses the trip, bags and entries already loaded on the trip page, including `is_packed`.
- **Unaffected**: the public share page, Supabase RLS, Firebase Auth, deployment pipeline. No server-side component and no new cost.
