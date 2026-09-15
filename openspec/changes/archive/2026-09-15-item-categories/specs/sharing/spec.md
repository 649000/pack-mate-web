## ADDED Requirements

### Requirement: Shared view shows item categories

The shared view SHALL show each entry's category when it is set. The shared view MUST remain read-only and MUST NOT let a visitor change any category.

#### Scenario: Entry categories are shown

- **WHEN** a shared trip has entries with categories
- **THEN** the shared view shows each entry's category

#### Scenario: Uncategorised entries

- **WHEN** a shared trip has entries with no category
- **THEN** the shared view shows those entries without a category

#### Scenario: Still read-only

- **WHEN** a visitor views a shared packing list
- **THEN** the visitor cannot change any entry's category

### Requirement: Shared view shows weight by category

The shared view SHALL show the trip's weight grouped by category, covering the whole list including entries marked With Me and unassigned. Entries with no category SHALL be grouped as uncategorised. The system SHALL mark the breakdown as incomplete when any counted entry has no weight, and SHALL distinguish this breakdown from the baggage total.

#### Scenario: Breakdown is shown

- **WHEN** a visitor opens a valid link for a trip whose entries have categories and weights
- **THEN** the shared view shows the weight grouped by category

#### Scenario: Uncategorised entries are grouped

- **WHEN** a shared trip has entries with no category
- **THEN** their weight is shown under an uncategorised grouping

#### Scenario: Incomplete weight is marked

- **WHEN** some counted entries have no weight
- **THEN** the shared view marks the breakdown as incomplete
