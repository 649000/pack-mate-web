## Purpose

Lets a trip owner create a public, read-only link to a trip's packing list, and lets anyone holding that link view it without signing in. The owner can see all their links in one place and revoke them at any time.

## ADDED Requirements

### Requirement: Create a public link for a trip

The system SHALL allow an authenticated user to create a public share link for a trip they own. A trip SHALL have at most one active link at a time. Creating a link for a trip that already has an active link SHALL return that existing link rather than creating another.

#### Scenario: Create a link

- **WHEN** an authenticated user shares a trip they own
- **THEN** the system creates an active public link for that trip and shows the user its URL

#### Scenario: Only one active link per trip

- **WHEN** an authenticated user shares a trip that already has an active link
- **THEN** the system returns the existing link and does not create a second one

#### Scenario: Link is created only for an owned trip

- **WHEN** a user attempts to share a trip they do not own
- **THEN** the system denies the request and creates nothing

### Requirement: View a shared packing list without signing in

The system SHALL let anyone holding a valid link view the trip's packing list read-only, without an authenticated session. The shared view SHALL NOT allow the viewer to change any data.

#### Scenario: Valid link

- **WHEN** a visitor opens a link that is active and not expired
- **THEN** the system shows the trip's packing list without requiring sign-in

#### Scenario: Read-only

- **WHEN** a visitor views a shared packing list
- **THEN** the system offers no action that changes the trip, its bags or its entries

#### Scenario: Signed-in visitor

- **WHEN** a user signed in to a different account opens a valid share link
- **THEN** the system shows the same read-only view

### Requirement: Shared view shows the packing list

The shared view SHALL show the trip's name and dates, its bags including nested bags, and its entries grouped by location: inside a bag, marked With Me, or unassigned. For each entry it SHALL show the name, quantity and packed state, and the description, link and image URL when set. It SHALL show packing progress and, for each bag, the bag's weight, weight limit and whether it is under or over that limit.

#### Scenario: Trip details and grouping

- **WHEN** a visitor opens a valid link
- **THEN** the system shows the trip name and dates, with entries grouped by their bag, With Me, or unassigned

#### Scenario: Nested bags

- **WHEN** the trip has a bag nested inside another bag
- **THEN** the shared view shows that nesting

#### Scenario: Entry details

- **WHEN** a trip entry has a description, link or image URL
- **THEN** the shared view shows those details

#### Scenario: Progress and weights

- **WHEN** a visitor opens a valid link
- **THEN** the system shows packing progress and each bag's weight against its limit where set

#### Scenario: Empty packing list

- **WHEN** a shared trip has no entries
- **THEN** the system shows the trip with an empty state

### Requirement: Shared view reflects current data

The system SHALL read the trip's current data when the shared page loads and when the visitor refreshes it. The system SHALL NOT push updates to an open shared page.

#### Scenario: Refresh shows changes

- **WHEN** the owner changes the trip and a visitor refreshes the shared page
- **THEN** the visitor sees the current packing list

#### Scenario: No automatic updates

- **WHEN** the owner changes the trip while a visitor has the shared page open
- **THEN** the open page does not change until the visitor reloads or refreshes

### Requirement: Shared view excludes private data

The shared view MUST NOT expose the owner's identity, the owner's user identifier, identifiers of the library items or bags a trip was copied from, the owner's profile, or any other trip.

#### Scenario: No owner or library identifiers

- **WHEN** the system serves a shared packing list
- **THEN** the response contains no owner identifier, no library source identifiers and no other trips

#### Scenario: Only the requested trip

- **WHEN** a visitor opens a valid link
- **THEN** the system returns only the trip the link points to

### Requirement: Public links are not indexed

The system SHALL prevent public share pages from being indexed by search engines and MUST NOT disclose the link to third-party sites when a visitor follows an external item link.

#### Scenario: Not indexed

- **WHEN** a search engine crawls a share page
- **THEN** the system instructs it not to index the page

#### Scenario: No referrer disclosure

- **WHEN** a visitor follows an external link from a shared packing list
- **THEN** the share URL is not sent to that external site as the referring page

### Requirement: Revoke a public link

The system SHALL allow the owner to revoke an active link. A revoked link SHALL stop working immediately and SHALL remain visible to the owner as revoked.

#### Scenario: Revoke

- **WHEN** an owner revokes an active link
- **THEN** the link no longer shows the packing list

#### Scenario: Revoked link is listed

- **WHEN** an owner views their links after revoking one
- **THEN** the system shows that link as revoked

### Requirement: Regenerate a public link

The system SHALL allow the owner to regenerate a link, replacing the current URL with a new one. The previous URL SHALL stop working immediately.

#### Scenario: Regenerate

- **WHEN** an owner regenerates an active link
- **THEN** the system returns a new URL, the new URL works, and the previous URL no longer works

### Requirement: Links can expire

The system SHALL allow the owner to set an optional expiry on a link. An expired link SHALL stop working. A link with no expiry SHALL remain valid until revoked or its trip is deleted.

#### Scenario: Set an expiry

- **WHEN** an owner sets an expiry when sharing a trip
- **THEN** the link stops working once that time has passed

#### Scenario: No expiry

- **WHEN** an owner shares a trip without setting an expiry
- **THEN** the link keeps working until it is revoked or the trip is deleted

### Requirement: Unavailable links are indistinguishable

The system MUST show the same generic unavailable state for a link that does not exist, has been revoked, has expired, or points to a deleted trip. It MUST NOT reveal which of these applies.

#### Scenario: Revoked, expired, unknown and deleted all look the same

- **WHEN** a visitor opens a link that is unknown, revoked, expired, or whose trip was deleted
- **THEN** the system shows the same unavailable state for each

### Requirement: View and manage own links

The system SHALL provide a page listing the authenticated user's share links, showing the trip name, when the link was created, its expiry if set, and whether it is active or revoked. The page SHALL let the user copy a link, regenerate an active link and revoke an active link. The system MUST show a user only their own links and MUST NOT let a user copy, regenerate or revoke another user's link.

#### Scenario: List own links

- **WHEN** a user opens the shared links page
- **THEN** the system shows only that user's links

#### Scenario: Empty state

- **WHEN** a user with no links opens the shared links page
- **THEN** the system shows an empty state

#### Scenario: Copy a link

- **WHEN** a user chooses to copy a link
- **THEN** the system copies that link's full URL

#### Scenario: Another user's link is inaccessible

- **WHEN** a user attempts to copy, regenerate or revoke a link they do not own
- **THEN** the system denies the operation and changes nothing

### Requirement: Share from a trip

The system SHALL let the owner create and copy a share link from the trip they are viewing.

#### Scenario: Share from the trip page

- **WHEN** an owner chooses to share the trip they are viewing
- **THEN** the system creates or returns the trip's link and lets the owner copy it
