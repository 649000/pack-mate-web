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
