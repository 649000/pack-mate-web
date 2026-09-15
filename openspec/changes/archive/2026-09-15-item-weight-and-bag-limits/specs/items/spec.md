## ADDED Requirements

### Requirement: Record item weight
The system SHALL allow an authenticated user to attach an optional weight to a reusable item, entered and displayed in the user's preferred unit and stored canonically in grams. The weight is per unit of the item.

#### Scenario: Set weight when creating an item
- **WHEN** a user creates an item with a weight
- **THEN** the item is stored with that weight

#### Scenario: Edit weight
- **WHEN** a user changes the weight of a library item
- **THEN** the library item is updated with the new weight

#### Scenario: Clear weight
- **WHEN** a user removes the weight from an item
- **THEN** the item is stored without a weight

#### Scenario: Weight is per unit
- **WHEN** a trip entry has a unit weight and a quantity greater than one
- **THEN** its total weight is the unit weight multiplied by the quantity

#### Scenario: Library weight edit does not change existing packing lists
- **WHEN** a user changes the weight of a library item that has already been added to a trip
- **THEN** the trip's packing list entries are unchanged

### Requirement: Validate item weight
The system SHALL reject a weight that is negative, not a number, or greater than the allowed maximum.

#### Scenario: Reject a negative weight
- **WHEN** a user saves an item with a negative weight
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject a non-numeric weight
- **WHEN** a user saves an item with a weight that is not a number
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject an excessive weight
- **WHEN** a user saves an item with a weight greater than the allowed maximum
- **THEN** the system rejects the request and does not save the weight
