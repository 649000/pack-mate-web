## MODIFIED Requirements

### Requirement: View weight by category

The system SHALL show a trip's weight grouped by category. Each category's weight SHALL be the sum of its entries' unit weight multiplied by quantity. The breakdown SHALL cover the whole list, including entries marked With Me and unassigned entries. Entries with no category SHALL be grouped as uncategorised. The system SHALL mark the breakdown as incomplete when any counted entry has no weight, and SHALL distinguish this breakdown from the baggage total. The system SHALL render the breakdown as a chart.

#### Scenario: Weight summed per category

- **WHEN** a trip has entries with weights in more than one category
- **THEN** the breakdown shows each category's weight as the sum of its entries' unit weight multiplied by quantity

#### Scenario: Whole list is included

- **WHEN** a trip has entries marked With Me or left unassigned
- **THEN** those entries contribute to their category's weight in the breakdown

#### Scenario: Uncategorised entries are grouped

- **WHEN** a trip has entries with no category
- **THEN** their weight is shown under an uncategorised grouping

#### Scenario: Incomplete weight is marked

- **WHEN** some counted entries have no weight
- **THEN** the system marks the breakdown as incomplete

#### Scenario: No weights

- **WHEN** no entry in the trip has a weight
- **THEN** the system shows a breakdown of zero and does not present it as a final weight

#### Scenario: Shown as a chart

- **WHEN** the system shows the weight-by-category breakdown
- **THEN** it renders the breakdown as a chart with a labelled bar per category, showing the category's weight

## ADDED Requirements

### Requirement: Filter entries by packed state

The system SHALL allow a user to filter a trip's entries by packed state, showing all entries, only packed entries, or only unpacked entries. Filtering MUST NOT change any entry and MUST NOT affect bag, With Me or unassigned grouping, packing progress, or any weight total. The filter SHALL combine with the trip's name search and category filter.

#### Scenario: Show only unpacked entries

- **WHEN** a user filters the trip to unpacked entries
- **THEN** the system shows only entries that are not packed

#### Scenario: Show only packed entries

- **WHEN** a user filters the trip to packed entries
- **THEN** the system shows only entries that are packed

#### Scenario: Clear the packed filter

- **WHEN** a user clears the packed filter
- **THEN** the system shows the trip without the packed filter applied

#### Scenario: Filter spans locations

- **WHEN** a user filters by packed state and matching entries are spread across a bag, With Me and unassigned
- **THEN** the system shows all matching entries regardless of their location

#### Scenario: Progress and weights are unaffected

- **WHEN** a user filters the trip by packed state
- **THEN** packing progress and every weight total still reflect the whole list, not the filtered subset

#### Scenario: No entries in the selected state

- **WHEN** a user selects a packed state with no matching entries
- **THEN** the system shows an empty result state
