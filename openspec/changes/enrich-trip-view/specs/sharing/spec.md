## MODIFIED Requirements

### Requirement: Shared view shows weight by category

The shared view SHALL show the trip's weight grouped by category, covering the whole list including entries marked With Me and unassigned. Entries with no category SHALL be grouped as uncategorised. The system SHALL mark the breakdown as incomplete when any counted entry has no weight, and SHALL distinguish this breakdown from the baggage total. The shared view SHALL render the breakdown as a chart.

#### Scenario: Breakdown is shown

- **WHEN** a visitor opens a valid link for a trip whose entries have categories and weights
- **THEN** the shared view shows the weight grouped by category

#### Scenario: Uncategorised entries are grouped

- **WHEN** a shared trip has entries with no category
- **THEN** their weight is shown under an uncategorised grouping

#### Scenario: Incomplete weight is marked

- **WHEN** some counted entries have no weight
- **THEN** the shared view marks the breakdown as incomplete

#### Scenario: Shown as a chart

- **WHEN** the shared view shows the weight-by-category breakdown
- **THEN** it renders the breakdown as a chart with a labelled bar per category, showing the category's weight

## ADDED Requirements

### Requirement: Shared view shows the departure countdown

The shared view SHALL show the same departure countdown as the owner's trip view, derived from the trip's start and end dates. When the trip has no start date, the shared view SHALL show no countdown. The countdown SHALL remain read-only.

#### Scenario: Countdown is shown

- **WHEN** a visitor opens a valid link for a trip with a start date
- **THEN** the shared view shows the departure countdown

#### Scenario: No start date

- **WHEN** a visitor opens a valid link for a trip with no start date
- **THEN** the shared view shows no countdown

#### Scenario: Read-only

- **WHEN** a visitor views the shared packing list
- **THEN** the visitor cannot change the trip's dates or countdown
