## MODIFIED Requirements

### Requirement: User can export their data

The system SHALL let an authenticated user download their data as a single JSON file containing their profile, trips, bags, items, packing-list entries and share links.

#### Scenario: Export data

- **WHEN** an authenticated user requests an export
- **THEN** the system downloads a JSON file containing that user's data

#### Scenario: Export contains only own data

- **WHEN** a user exports their data
- **THEN** the file contains only data owned by that user

#### Scenario: Export includes share links

- **WHEN** a user who has public share links requests an export
- **THEN** the file includes those share links

#### Scenario: Export with no data

- **WHEN** a user with no trips, bags or items requests an export
- **THEN** the system still produces a valid JSON file containing their profile
