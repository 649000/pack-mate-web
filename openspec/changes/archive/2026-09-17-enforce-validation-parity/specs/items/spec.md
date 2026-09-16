## ADDED Requirements

### Requirement: Validate item name length
The system SHALL reject a reusable item name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever an item is created or edited, including a direct database write.

#### Scenario: Reject an over-long item name
- **WHEN** a user saves an item with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the item

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves an item with a name of exactly 200 characters
- **THEN** the item is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to an item without going through the application
- **THEN** the database rejects the write

## MODIFIED Requirements

### Requirement: Validate item weight
The system SHALL reject a weight that is negative, not a number, or greater than 100000 grams.

#### Scenario: Reject a negative weight
- **WHEN** a user saves an item with a negative weight
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject a non-numeric weight
- **WHEN** a user saves an item with a weight that is not a number
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject an excessive weight
- **WHEN** a user saves an item with a weight greater than 100000 grams
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject an excessive weight written directly to the database
- **WHEN** a weight greater than 100000 grams is written to an item without going through the application
- **THEN** the database rejects the write
