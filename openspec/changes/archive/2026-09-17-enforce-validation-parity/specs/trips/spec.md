## ADDED Requirements

### Requirement: Validate trip name length
The system SHALL reject a trip name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever a trip is created or edited, including a direct database write.

#### Scenario: Reject an over-long trip name
- **WHEN** a user saves a trip with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the trip

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves a trip with a name of exactly 200 characters
- **THEN** the trip is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to a trip without going through the application
- **THEN** the database rejects the write
