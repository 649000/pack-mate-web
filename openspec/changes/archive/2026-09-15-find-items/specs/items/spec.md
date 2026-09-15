## ADDED Requirements

### Requirement: Record optional item details
The system SHALL allow an authenticated user to attach an optional description, link, and image URL to a reusable item, settable when creating or editing the item.

#### Scenario: Add details when creating an item
- **WHEN** a user creates an item with a description, link, and image URL
- **THEN** the item is stored with those details in their library

#### Scenario: Edit details on an existing item
- **WHEN** a user changes the description, link, or image URL of a library item
- **THEN** the library item is updated with the new details

#### Scenario: Clear details
- **WHEN** a user removes the description, link, or image URL from a library item
- **THEN** the item is stored without that detail

#### Scenario: Library detail edit does not change existing packing lists
- **WHEN** a user edits the details of a library item that has already been added to a trip
- **THEN** the trip's packing list entries are unchanged

### Requirement: Validate item details
The system SHALL reject a link or image URL that is not an absolute http or https URL, and SHALL reject a description longer than the allowed maximum.

#### Scenario: Reject a non-http link
- **WHEN** a user saves an item with a link that is not an http or https URL
- **THEN** the system rejects the request and does not save the link

#### Scenario: Reject a non-http image URL
- **WHEN** a user saves an item with an image URL that is not an http or https URL
- **THEN** the system rejects the request and does not save the image URL

#### Scenario: Reject an over-long description
- **WHEN** a user saves an item with a description longer than the allowed maximum
- **THEN** the system rejects the request and does not save the description
