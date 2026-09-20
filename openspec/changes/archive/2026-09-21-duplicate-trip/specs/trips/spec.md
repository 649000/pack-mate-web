## ADDED Requirements

### Requirement: Duplicate a trip
The system SHALL allow an authenticated user to duplicate one of their own trips. Duplicating SHALL prompt for the new trip's trip-level fields — name, country, destination, start date and end date — prefilled with the source trip's name, country and destination and with the dates empty. On confirmation the system SHALL create a new trip from those values and copy the source trip's packing list: its trip bags, including nesting and weight limits, and its trip entries, including name, quantity, With Me, position, description, link, image URL, weight and category. Every copied entry SHALL start unpacked. The system MUST NOT copy packed state or share links. The copy SHALL be independent of the source, so later changes to either trip do not affect the other. The system SHALL reject an attempt to duplicate another user's trip.

#### Scenario: Duplicate a trip
- **WHEN** a user duplicates a trip and confirms the prompted fields
- **THEN** a new trip is created with those fields and a copy of the source trip's bags and entries

#### Scenario: Prompt prefills trip fields and leaves dates empty
- **WHEN** the duplicate prompt opens for a trip that has a name, country, destination and dates
- **THEN** the name, country and destination are prefilled from the source trip and the start and end date fields are empty

#### Scenario: Copied entries start unpacked
- **WHEN** a user duplicates a trip that has packed entries
- **THEN** every entry in the copy is unpacked

#### Scenario: Bag nesting is preserved
- **WHEN** a user duplicates a trip that has a bag nested inside another bag
- **THEN** the copy has the same nesting of bags

#### Scenario: The copy is independent of the source
- **WHEN** a user edits either the source trip or its copy after duplicating
- **THEN** the other trip is unchanged

#### Scenario: Cancelling creates nothing
- **WHEN** a user dismisses the duplicate prompt without confirming
- **THEN** no new trip is created

#### Scenario: Trip-level validation applies
- **WHEN** a user confirms the duplicate prompt with no country or with a name longer than 200 characters
- **THEN** the system rejects the request and creates no trip

#### Scenario: Cannot duplicate another user's trip
- **WHEN** a user attempts to duplicate a trip they do not own
- **THEN** the system rejects the request and creates no trip
