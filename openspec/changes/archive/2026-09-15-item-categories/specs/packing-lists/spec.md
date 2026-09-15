## ADDED Requirements

### Requirement: Copy item category onto a trip

The system SHALL copy a reusable item's category onto the trip entry when the item is added to a trip, including items added as part of a bag's default contents. Editing a trip entry's category SHALL NOT change the library item.

#### Scenario: Add an item with a category to a trip

- **WHEN** a user adds a library item that has a category to a trip
- **THEN** the trip entry carries a copy of that category

#### Scenario: Add a bag with default contents

- **WHEN** a user adds a library bag whose default contents include categorised items
- **THEN** the copied trip entries carry those categories

#### Scenario: Add an uncategorised item

- **WHEN** a user adds a library item that has no category to a trip
- **THEN** the trip entry is uncategorised

#### Scenario: Editing a trip entry's category does not change the library

- **WHEN** a user changes the category of a trip entry
- **THEN** the corresponding library item is unchanged

### Requirement: Filter entries by category

The system SHALL allow a user to filter a trip's entries by category, showing only entries in the selected category. The filter SHALL offer only the categories present in the trip, plus an option for uncategorised entries. Filtering MUST NOT change any entry and MUST NOT affect bag, With Me or unassigned grouping.

#### Scenario: Filter by a category

- **WHEN** a user selects a category in the trip view
- **THEN** the system shows only the trip entries in that category

#### Scenario: Filter spans locations

- **WHEN** a user filters by a category whose entries are spread across a bag, With Me and unassigned
- **THEN** the system shows all matching entries regardless of their location

#### Scenario: Offer only categories in use

- **WHEN** a user opens the trip filter
- **THEN** the system offers only the categories present in the trip, plus an uncategorised option when such entries exist

#### Scenario: Clear the trip filter

- **WHEN** a user clears the category filter
- **THEN** the system shows the trip without the filter applied

#### Scenario: No entries in a category

- **WHEN** a user selects a category with no entries
- **THEN** the system shows an empty result state

### Requirement: View weight by category

The system SHALL show a trip's weight grouped by category. Each category's weight SHALL be the sum of its entries' unit weight multiplied by quantity. The breakdown SHALL cover the whole list, including entries marked With Me and unassigned entries. Entries with no category SHALL be grouped as uncategorised. The system SHALL mark the breakdown as incomplete when any counted entry has no weight, and SHALL distinguish this breakdown from the baggage total.

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
