## MODIFIED Requirements

### Requirement: Create a trip
The system SHALL allow an authenticated user to create a trip with a name, a country, and optional dates and destination.

#### Scenario: Create a trip
- **WHEN** a user creates a trip with a name and a country
- **THEN** the trip is created and owns an empty packing list

#### Scenario: Trip name is required
- **WHEN** a user attempts to create a trip without a name
- **THEN** the system rejects the request and does not create the trip

#### Scenario: Country is required
- **WHEN** a user attempts to create a trip without selecting a country
- **THEN** the system rejects the request and does not create the trip

### Requirement: Edit a trip
The system SHALL allow a user to edit a trip's name, dates, destination and country.

#### Scenario: Edit a trip
- **WHEN** a user changes a trip's name, dates, destination or country
- **THEN** the trip is updated

## ADDED Requirements

### Requirement: Trip country is required and known
The system SHALL require every trip to have a country. The country SHALL be stored as an ISO 3166-1 alpha-2 code and SHALL be one of the known countries offered by the system. The requirement SHALL be enforced wherever a trip is created or edited, including a direct database write.

#### Scenario: Reject an unknown country code
- **WHEN** a user saves a trip with a country code that is not a known country
- **THEN** the system rejects the request and does not save the trip

#### Scenario: Reject a trip with no country written directly to the database
- **WHEN** a trip is written without a country code without going through the application
- **THEN** the database rejects the write

#### Scenario: Reject an unknown country code written directly to the database
- **WHEN** a trip is written with a country code that is not a known country without going through the application
- **THEN** the database rejects the write

### Requirement: Trip destination is optional and length-limited
The system SHALL treat a trip's destination as optional. When set, the system SHALL reject a destination longer than 200 characters after trimming surrounding whitespace. The limit SHALL be enforced wherever a trip is created or edited, including a direct database write.

#### Scenario: Reject an over-long destination
- **WHEN** a user saves a trip with a destination longer than 200 characters
- **THEN** the system rejects the request and does not save the trip

#### Scenario: Accept a trip without a destination
- **WHEN** a user saves a trip with a country and no destination
- **THEN** the trip is saved with no destination

#### Scenario: Reject an over-long destination written directly to the database
- **WHEN** a destination longer than 200 characters is written to a trip without going through the application
- **THEN** the database rejects the write

### Requirement: Show the trip's country by name
The system SHALL display a trip's country using its country name and MUST NOT display the raw ISO country code to users.

#### Scenario: Country is shown by name
- **WHEN** a trip's country is displayed in the trips list, the trip header or a shared view
- **THEN** the country name is shown, not the country code
