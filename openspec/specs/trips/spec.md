# trips Specification

## Purpose
Lets a user create a trip, which owns a packing list of the things they intend to bring.

## Requirements

### Requirement: Create a trip
The system SHALL allow an authenticated user to create a trip with a name and optional dates.

#### Scenario: Create a trip
- **WHEN** a user creates a trip with a name
- **THEN** the trip is created and owns an empty packing list

#### Scenario: Trip name is required
- **WHEN** a user attempts to create a trip without a name
- **THEN** the system rejects the request and does not create the trip

### Requirement: Edit a trip
The system SHALL allow a user to edit a trip's name and dates.

#### Scenario: Edit a trip
- **WHEN** a user changes a trip's name or dates
- **THEN** the trip is updated

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

### Requirement: Delete a trip
The system SHALL allow a user to delete a trip, removing its packing list.

#### Scenario: Delete a trip
- **WHEN** a user deletes a trip
- **THEN** the trip and its packing list are removed

### Requirement: View trips
The system SHALL list the authenticated user's trips.

#### Scenario: List trips
- **WHEN** a user views their trips
- **THEN** the system shows only trips owned by that user

#### Scenario: No trips yet
- **WHEN** a user with no trips views their trips
- **THEN** the system shows an empty state
