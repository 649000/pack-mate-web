## ADDED Requirements

### Requirement: A bag can carry an icon

The system SHALL let a user choose an icon for a library bag from a fixed set of keys. The icon SHALL be persisted with the bag, copied onto a trip bag when the library bag is added to a trip, and copied when a trip is duplicated. When no icon is chosen, the system SHALL derive one from the bag's contents and otherwise show a generic icon. An icon key outside the fixed set SHALL be rejected.

#### Scenario: Choose an icon

- **WHEN** a user saves a library bag with a chosen icon
- **THEN** the bag is stored with that icon

#### Scenario: Clear an icon

- **WHEN** a user saves a library bag without choosing an icon
- **THEN** the bag is stored without an icon and one is derived for display from its contents

#### Scenario: Icon is copied when the bag is added to a trip

- **WHEN** a user adds a library bag that has a chosen icon to a trip
- **THEN** the resulting trip bag carries that icon

#### Scenario: Icon is copied when a trip is duplicated

- **WHEN** a user duplicates a trip whose bags carry icons
- **THEN** the new trip's bags carry the same icons

#### Scenario: Library icon change does not affect existing trips

- **WHEN** a user changes the icon of a library bag that has already been added to a trip
- **THEN** the trip's bag icon is unchanged

#### Scenario: Reject an unknown icon

- **WHEN** an icon outside the fixed set is saved to a bag
- **THEN** the system rejects the request and does not save the icon

#### Scenario: Reject an unknown icon written directly to the database

- **WHEN** an icon outside the fixed set is written to a bag without going through the application
- **THEN** the database rejects the write
