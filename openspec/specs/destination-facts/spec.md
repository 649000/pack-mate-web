# destination-facts Specification

## Purpose

Shows a trip's country-level travel facts — power, currency, calling code and time zones — so a traveller can pack and prepare for a destination without leaving the packing list.

## Requirements

### Requirement: Destination facts exist for known countries

The system SHALL provide destination facts for each known country to the extent the data is known: a currency code, a country calling code, plug type(s), voltage and frequency, and time zone(s). A country MAY have more than one plug type and more than one time zone. A country MAY have partial or no facts, and the system SHALL show only the fields that are available.

#### Scenario: Facts for a known country

- **WHEN** the system has destination facts for a trip's country
- **THEN** the available fields among the currency code, calling code, plug type(s), voltage, frequency and time zone(s) are available

#### Scenario: Country with multiple plug types

- **WHEN** a country uses more than one plug type
- **THEN** all of its plug types are available

#### Scenario: Country with multiple time zones

- **WHEN** a country spans more than one time zone
- **THEN** all of its time zones are available

#### Scenario: Country with partial facts

- **WHEN** a country has some facts but not others
- **THEN** the available fields are shown and the unavailable fields are omitted

### Requirement: Show a trip's power requirements

The system SHALL show a trip's plug type(s), voltage and frequency, and SHALL show a distinct image for each plug type so the user can recognise the socket. The system SHALL show voltage and frequency in a consistent, unit-labelled form.

#### Scenario: Plug types are shown with an image

- **WHEN** a trip's country has one or more plug types
- **THEN** each plug type is shown with an image representing that plug

#### Scenario: Voltage and frequency are shown

- **WHEN** a trip's country facts are shown
- **THEN** the voltage and the frequency are shown, each with its unit

### Requirement: Show a trip's currency

The system SHALL show the trip's currency code and its currency symbol.

#### Scenario: Currency code and symbol are shown

- **WHEN** a trip's country facts are shown
- **THEN** the currency code and symbol for that country are shown

### Requirement: Show the country calling code

The system SHALL show the country calling code for the trip's country.

#### Scenario: Calling code is shown

- **WHEN** a trip's country facts are shown
- **THEN** the country calling code is shown

### Requirement: Show time zones and the difference from the viewer

The system SHALL show the trip's time zone(s) and the difference between each and the viewer's time zone. When the trip's destination text matches a known city within the country, the system SHALL show that city's time zone; otherwise it SHALL show all of the country's time zones. The system SHALL compute each difference for the trip's start date when the trip has one, and for the current date otherwise, so that daylight saving is reflected. When a trip spans a change in offset, the system SHALL reflect the offset in effect at the start date.

#### Scenario: Destination matches a city

- **WHEN** a trip's destination text matches a known city in its country
- **THEN** that city's time zone and its difference from the viewer are shown

#### Scenario: Destination does not match a city

- **WHEN** a trip's destination text does not match a known city in its country
- **THEN** all of the country's time zones and their differences from the viewer are shown

#### Scenario: Single time zone country

- **WHEN** a trip's country has a single time zone
- **THEN** that time zone and its difference from the viewer are shown

#### Scenario: Difference reflects the trip date

- **WHEN** a trip has a start date and the offset between the destination and the viewer differs between the current date and the start date
- **THEN** the difference shown is the one in effect on the start date

#### Scenario: Trip has no dates

- **WHEN** a trip has no start date
- **THEN** the difference shown is the one in effect on the current date

### Requirement: Show destination facts on the trip and shared views

The system SHALL show destination facts on the trip page and on the shared trip view. The shared trip view SHALL show destination facts without requiring the viewer to be authenticated.

#### Scenario: Trip page

- **WHEN** a user opens a trip that has a country
- **THEN** the trip page shows the destination facts for that country

#### Scenario: Shared view

- **WHEN** an anonymous visitor opens a valid share link
- **THEN** the shared view shows the destination facts for the trip's country

### Requirement: Destination facts never block the packing list

The system SHALL treat destination facts as supplementary. While the facts are loading, or when they are unavailable, the system SHALL show no destination facts and SHALL NOT show an error, and the packing list, progress and weights SHALL remain fully usable. The system SHALL NOT require the facts to load before showing the rest of a trip.

#### Scenario: Facts are loading

- **WHEN** a trip is shown and the destination facts have not yet loaded
- **THEN** no destination facts are shown and the packing list is usable

#### Scenario: Facts are unavailable

- **WHEN** the destination facts cannot be loaded
- **THEN** no destination facts are shown, no error is presented, and the packing list is unaffected

#### Scenario: Country has no facts

- **WHEN** a trip's country has no destination facts available
- **THEN** no destination facts are shown and the packing list is unaffected

### Requirement: Destination facts are read-only

The system SHALL expose destination facts as read-only. No authenticated or anonymous user SHALL be able to create, modify or delete destination facts, including by writing directly to the database.

#### Scenario: A user attempts to change destination facts

- **WHEN** any user attempts to create, modify or delete destination facts
- **THEN** the system rejects the attempt

#### Scenario: A user reads destination facts

- **WHEN** an authenticated or anonymous user reads destination facts
- **THEN** the system allows the read
