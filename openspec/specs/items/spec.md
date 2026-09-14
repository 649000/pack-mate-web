# items Specification

## Purpose
Lets a user maintain a reusable library of items that can be added to any trip's packing list.

## Requirements

### Requirement: Create a reusable item
The system SHALL allow an authenticated user to create a reusable item with a name and a default quantity.

#### Scenario: Create an item
- **WHEN** a user creates an item with a name and default quantity
- **THEN** the item is stored in their library and available to add to any trip

#### Scenario: Item name is required
- **WHEN** a user attempts to create an item without a name
- **THEN** the system rejects the request and does not create the item

### Requirement: Edit a reusable item
The system SHALL allow a user to edit the name and default quantity of an item in their library.

#### Scenario: Edit an item
- **WHEN** a user changes the name or default quantity of a library item
- **THEN** the library item is updated

#### Scenario: Library edit does not change existing packing lists
- **WHEN** a user edits a library item that has already been added to a trip
- **THEN** the trip's packing list entries are unchanged

### Requirement: Delete a reusable item
The system SHALL allow a user to delete an item from their library.

#### Scenario: Delete an item
- **WHEN** a user deletes a library item
- **THEN** the item is removed from the library

#### Scenario: Library delete does not change existing packing lists
- **WHEN** a user deletes a library item that has already been added to a trip
- **THEN** the trip's packing list entries remain unchanged
