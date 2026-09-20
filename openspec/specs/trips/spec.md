# trips Specification

## Purpose
Lets a user create a trip, which owns a packing list of the things they intend to bring.

## Requirements

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

### Requirement: Show a departure countdown

The system SHALL show a departure countdown for a trip, derived from the trip's start and end dates relative to the current date in the viewer's local time zone. Before the start date it SHALL show how many days remain until departure, including that the trip leaves today on the start date. From the start date through the end date it SHALL show the trip as in progress, including the current day number and, when an end date is set, the total number of days. After the end date it SHALL show that the trip has ended. When the trip has no start date, the system SHALL show no countdown. The countdown SHALL be derived only and MUST NOT modify the trip's dates.

#### Scenario: Countdown before departure

- **WHEN** a trip's start date is in the future
- **THEN** the system shows the number of days until departure

#### Scenario: Leaving today

- **WHEN** a trip's start date is the current date
- **THEN** the system shows that the trip leaves today

#### Scenario: Trip in progress with an end date

- **WHEN** the current date is on or after a trip's start date and on or before its end date
- **THEN** the system shows the current day number and the total number of days

#### Scenario: Trip in progress without an end date

- **WHEN** the current date is on or after a trip's start date and the trip has no end date
- **THEN** the system shows the current day number without a total

#### Scenario: Trip has ended

- **WHEN** the current date is after a trip's end date
- **THEN** the system shows that the trip has ended

#### Scenario: No start date

- **WHEN** a trip has no start date
- **THEN** the system shows no countdown for that trip

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
