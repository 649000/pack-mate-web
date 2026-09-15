## Why

Users want to show friends what they are bringing and how far along they are, without giving anyone access to their account. Today every trip, bag and entry is locked to its owner, so the only way to share is a screenshot. A read-only public link makes sharing a first-class action and gives the owner a single place to see and revoke what they have shared.

## What Changes

- Add a **public share link** for a trip. A signed-in owner creates a link; anyone holding it can view a read-only packing list without signing in.
- The shared view shows trip name and dates, the bags (including nested bags), items grouped by location (bag, With Me, unassigned), quantities, packed state, progress, weights and bag limits, plus each item's description, link and image URL.
- The shared view is read-only: viewers cannot change anything.
- The shared page reads current data when it loads and offers a manual refresh. It does not push updates.
- Add a **Shared Links** page listing the owner's links with the trip name, created date, expiry and status, and actions to copy, regenerate and revoke.
- Add a **Share** action to the trip page to create, copy and revoke a link.
- Links are opaque, high-entropy, and optional expiry; revoking or expiring a link stops access immediately. Invalid, revoked and expired links all show the same generic unavailable state.
- Public data is served through a single database function that returns an explicit projection. Anonymous clients get no direct table access, so no column can leak by default.
- Add share links to the account data export.

## Capabilities

### New Capabilities

- `sharing`: Lets a trip owner create, copy, regenerate and revoke a public read-only link to a trip's packing list, and lets anyone holding the link view it without signing in.

### Modified Capabilities

- `account`: The data export requirement now also includes the user's share links.

## Impact

- **Database**: new `packmate.share_links` table with owner-only RLS, indexes, and a single `security definer` read function granted to `anon` and `authenticated`. New migration.
- **Frontend**: new public `/share` page (no auth), new `/shares` management page in the app shell, and a Share action on the trip page. The trip view's presentation layer is extracted so the read-only shared view can reuse it.
- **Auth**: the public page is deliberately outside `RequireAuth`. The publishable Supabase key remains the only client credential.
- **Cost/abuse**: the share read is one anonymous, unauthenticated request per view. No server, Functions or polling is added.
- **Account**: export payload gains `share_links`; account deletion already removes them via the trip cascade.
- **Security**: no `user_id`, source ids or other trips are ever exposed; security headers and a `no-referrer` policy protect the token.
