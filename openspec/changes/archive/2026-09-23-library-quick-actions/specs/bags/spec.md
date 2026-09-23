## ADDED Requirements

### Requirement: Add a bag to a trip from the library

The system SHALL let a user add a library bag, with its default contents, to one of their trips from the bag library, without opening the trip first.

#### Scenario: Add a bag to a chosen trip

- **WHEN** a user chooses Add to trip on a library bag and selects one of their trips
- **THEN** the bag and its default contents are copied onto that trip and a confirmation is shown

#### Scenario: No trips to add to

- **WHEN** a user chooses Add to trip and has no trips
- **THEN** the dialog explains that a trip is needed first and does not add anything

### Requirement: Duplicate a reusable bag

The system SHALL let a user duplicate a library bag, creating a new bag that copies the source's name, icon, weight limit and default contents, without altering the source.

#### Scenario: Duplicate a bag

- **WHEN** a user duplicates a library bag
- **THEN** a new bag is created with the same icon, weight limit and default contents, and a name that distinguishes it from the source

#### Scenario: Source is unchanged

- **WHEN** a bag is duplicated
- **THEN** the source bag and its default contents are unchanged
