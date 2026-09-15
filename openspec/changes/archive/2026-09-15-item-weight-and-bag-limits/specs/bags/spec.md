## ADDED Requirements

### Requirement: Set a bag's default weight limit
The system SHALL allow a user to set an optional default weight limit on a library bag, stored canonically in grams. Adding the bag to a trip SHALL copy the limit onto the trip bag.

#### Scenario: Set a default limit
- **WHEN** a user sets a default weight limit on a library bag
- **THEN** the library bag is stored with that limit

#### Scenario: Clear a default limit
- **WHEN** a user removes the default weight limit from a library bag
- **THEN** the library bag is stored without a limit

#### Scenario: Limit is copied when the bag is added to a trip
- **WHEN** a user adds a library bag that has a default weight limit to a trip
- **THEN** the resulting trip bag carries that limit

#### Scenario: Library limit change does not affect existing trips
- **WHEN** a user changes the default limit of a library bag that has already been added to a trip
- **THEN** the trip's bag limit is unchanged

### Requirement: Validate bag weight limit
The system SHALL reject a weight limit that is negative, not a number, or greater than the allowed maximum.

#### Scenario: Reject a negative limit
- **WHEN** a user saves a bag with a negative weight limit
- **THEN** the system rejects the request and does not save the limit

#### Scenario: Reject an excessive limit
- **WHEN** a user saves a bag with a weight limit greater than the allowed maximum
- **THEN** the system rejects the request and does not save the limit
