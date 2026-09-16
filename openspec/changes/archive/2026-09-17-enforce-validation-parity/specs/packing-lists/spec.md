## ADDED Requirements

### Requirement: Validate packing list name length
The system SHALL reject a trip bag or trip entry name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever a trip bag or entry is created or edited, including a direct database write.

#### Scenario: Reject an over-long trip entry name
- **WHEN** a user adds or renames a trip entry with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the entry

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves a trip entry with a name of exactly 200 characters
- **THEN** the entry is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to a trip bag or trip entry without going through the application
- **THEN** the database rejects the write
