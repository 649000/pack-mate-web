## ADDED Requirements

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
