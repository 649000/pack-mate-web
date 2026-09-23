# bags Specification

## Purpose
Lets a user maintain a reusable library of bags (containers) and define the default contents each bag carries.

## Requirements

### Requirement: Create a reusable bag
The system SHALL allow an authenticated user to create a reusable bag with a name.

#### Scenario: Create a bag
- **WHEN** a user creates a bag with a name
- **THEN** the bag is stored in their library and available to add to any trip

#### Scenario: Bag name is required
- **WHEN** a user attempts to create a bag without a name
- **THEN** the system rejects the request and does not create the bag

### Requirement: Edit a reusable bag
The system SHALL allow a user to edit the name of a bag in their library.

#### Scenario: Edit a bag
- **WHEN** a user changes the name of a library bag
- **THEN** the library bag is updated

### Requirement: Delete a reusable bag
The system SHALL allow a user to delete a bag from their library.

#### Scenario: Delete a bag
- **WHEN** a user deletes a library bag
- **THEN** the bag and its default contents are removed from the library

#### Scenario: Library bag changes do not affect existing packing lists
- **WHEN** a user edits or deletes a library bag that has already been added to a trip
- **THEN** the trip's bags and entries remain unchanged

### Requirement: Manage a bag's default contents
The system SHALL allow a user to add reusable items to a bag's default contents, set a quantity for each, and remove them.

#### Scenario: Add an item to a bag's default contents
- **WHEN** a user adds a library item to a bag's default contents with a quantity
- **THEN** the item is stored as part of that bag's default contents

#### Scenario: Remove an item from a bag's default contents
- **WHEN** a user removes an item from a bag's default contents
- **THEN** the item is no longer part of that bag's default contents

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

### Requirement: Validate bag name length
The system SHALL reject a reusable bag name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever a bag is created or edited, including a direct database write.

#### Scenario: Reject an over-long bag name
- **WHEN** a user saves a bag with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the bag

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves a bag with a name of exactly 200 characters
- **THEN** the bag is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to a bag without going through the application
- **THEN** the database rejects the write

### Requirement: Validate bag weight limit
The system SHALL reject a weight limit that is negative, not a number, or greater than 100000 grams.

#### Scenario: Reject a negative limit
- **WHEN** a user saves a bag with a negative weight limit
- **THEN** the system rejects the request and does not save the limit

#### Scenario: Reject an excessive limit
- **WHEN** a user saves a bag with a weight limit greater than 100000 grams
- **THEN** the system rejects the request and does not save the limit

#### Scenario: Reject an excessive limit written directly to the database
- **WHEN** a weight limit greater than 100000 grams is written to a bag without going through the application
- **THEN** the database rejects the write

### Requirement: A bag can carry an icon

The system SHALL let a user choose an icon for a library bag from a fixed set of keys. The icon SHALL be persisted with the bag, copied onto a trip bag when the library bag is added to a trip, and copied when a trip is duplicated. When no icon is chosen, the system SHALL derive one from the bag's contents and otherwise show a generic icon. An icon key outside the fixed set SHALL be rejected.

#### Scenario: Choose an icon

- **WHEN** a user saves a library bag with a chosen icon
- **THEN** the bag is stored with that icon

#### Scenario: Clear an icon

- **WHEN** a user saves a library bag without choosing an icon
- **THEN** the bag is stored without an icon and one is derived for display from its contents

#### Scenario: Icon is copied when the bag is added to a trip

- **WHEN** a user adds a library bag that has a chosen icon to a trip
- **THEN** the resulting trip bag carries that icon

#### Scenario: Icon is copied when a trip is duplicated

- **WHEN** a user duplicates a trip whose bags carry icons
- **THEN** the new trip's bags carry the same icons

#### Scenario: Library icon change does not affect existing trips

- **WHEN** a user changes the icon of a library bag that has already been added to a trip
- **THEN** the trip's bag icon is unchanged

#### Scenario: Reject an unknown icon

- **WHEN** an icon outside the fixed set is saved to a bag
- **THEN** the system rejects the request and does not save the icon

#### Scenario: Reject an unknown icon written directly to the database

- **WHEN** an icon outside the fixed set is written to a bag without going through the application
- **THEN** the database rejects the write

### Requirement: Add a bag to a trip from the library

The system SHALL let a user add a library bag, with its default contents, to one of their trips from the bag library, without opening the trip first.

#### Scenario: Add a bag to a chosen trip

- **WHEN** a user chooses Add to trip on a library bag and selects one of their trips
- **THEN** the bag and its default contents are copied onto that trip and a confirmation is shown

#### Scenario: No trips to add to

- **WHEN** a user chooses Add to trip and has no trips
- **THEN** the dialog explains that a trip is needed first and does not add anything

### Requirement: Duplicate a reusable bag

The system SHALL let a user duplicate a library bag, creating a new bag that copies the source's name, icon, weight limit and default contents, without altering the source.

#### Scenario: Duplicate a bag

- **WHEN** a user duplicates a library bag
- **THEN** a new bag is created with the same icon, weight limit and default contents, and a name that distinguishes it from the source

#### Scenario: Source is unchanged

- **WHEN** a bag is duplicated
- **THEN** the source bag and its default contents are unchanged
