## ADDED Requirements

### Requirement: Validate bag name length
The system SHALL reject a reusable bag name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever a bag is created or edited, including a direct database write.

#### Scenario: Reject an over-long bag name
- **WHEN** a user saves a bag with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the bag

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves a bag with a name of exactly 200 characters
- **THEN** the bag is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to a bag without going through the application
- **THEN** the database rejects the write

## MODIFIED Requirements

### Requirement: Validate bag weight limit
The system SHALL reject a weight limit that is negative, not a number, or greater than 100000 grams.

#### Scenario: Reject a negative limit
- **WHEN** a user saves a bag with a negative weight limit
- **THEN** the system rejects the request and does not save the limit

#### Scenario: Reject an excessive limit
- **WHEN** a user saves a bag with a weight limit greater than 100000 grams
- **THEN** the system rejects the request and does not save the limit

#### Scenario: Reject an excessive limit written directly to the database
- **WHEN** a weight limit greater than 100000 grams is written to a bag without going through the application
- **THEN** the database rejects the write
