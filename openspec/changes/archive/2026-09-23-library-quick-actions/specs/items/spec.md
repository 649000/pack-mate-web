## ADDED Requirements

### Requirement: Add an item to a trip from the library

The system SHALL let a user add a library item to one of their trips from the item library, without opening the trip first. The item SHALL be added to the chosen trip using the item's default quantity, unassigned, and SHALL appear on that trip.

#### Scenario: Add an item to a chosen trip

- **WHEN** a user chooses Add to trip on a library item and selects one of their trips
- **THEN** the item is added to that trip and a confirmation is shown

#### Scenario: No trips to add to

- **WHEN** a user chooses Add to trip and has no trips
- **THEN** the dialog explains that a trip is needed first and does not add anything

#### Scenario: A user cannot add to another user's trip

- **WHEN** an item is added to a trip the user does not own
- **THEN** the system rejects the request
