## ADDED Requirements

### Requirement: Copy item weight onto a trip
The system SHALL copy a reusable item's weight onto the trip entry when the item is added to a trip, including items added as part of a bag's default contents. Editing a trip entry's weight SHALL NOT change the library item.

#### Scenario: Add an item with weight to a trip
- **WHEN** a user adds a library item that has a weight to a trip
- **THEN** the trip entry carries a copy of that weight

#### Scenario: Add a bag with default contents
- **WHEN** a user adds a library bag whose default contents include weighted items
- **THEN** the copied trip entries carry those weights

#### Scenario: Editing a trip entry's weight does not change the library
- **WHEN** a user changes the weight of a trip entry
- **THEN** the corresponding library item is unchanged

### Requirement: Track a bag's weight against its limit
The system SHALL show each trip bag's total weight and, when the bag has a limit, whether it is under or over that limit. A bag's weight SHALL be the sum of its entries' unit weight multiplied by quantity. Entries marked With Me and unassigned entries SHALL NOT count toward a bag's weight.

#### Scenario: Bag weight is the sum of its entries
- **WHEN** a bag contains entries with weights and quantities
- **THEN** the bag's weight is the sum of each entry's unit weight multiplied by its quantity

#### Scenario: With Me and unassigned entries are excluded
- **WHEN** a trip has entries marked With Me or left unassigned
- **THEN** those entries do not contribute to any bag's weight

#### Scenario: Under the limit
- **WHEN** a bag with a limit weighs less than its limit
- **THEN** the system shows the bag as under its limit

#### Scenario: Over the limit
- **WHEN** a bag with a limit weighs more than its limit
- **THEN** the system shows the bag as over its limit

#### Scenario: No limit set
- **WHEN** a bag has no limit
- **THEN** the system shows its weight without an under or over state

#### Scenario: Entries without weight
- **WHEN** some entries in a bag have no weight
- **THEN** the bag's weight sums the entries that do have a weight and the system marks the total as incomplete

### Requirement: View total baggage weight
The system SHALL show the trip's total baggage weight as the sum of all its bags' weights. Entries marked With Me or unassigned SHALL NOT count toward the total.

#### Scenario: Total reflects all bags
- **WHEN** a trip has multiple bags with weights
- **THEN** the total baggage weight is the sum of those bags' weights

#### Scenario: Total with no weights
- **WHEN** no entry in the trip has a weight
- **THEN** the system shows a total of zero and does not present it as a final weight

### Requirement: Switch the displayed weight unit
The system SHALL allow a user to switch the unit used to display weights on a trip without changing their saved preference.

#### Scenario: Toggle the unit
- **WHEN** a user switches the trip's displayed unit between kg and lb
- **THEN** all weights on the trip are shown in the selected unit

#### Scenario: Toggle does not change the saved preference
- **WHEN** a user switches the trip's displayed unit
- **THEN** their saved account preference is unchanged
