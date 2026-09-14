# packing-lists Specification

## Purpose
Lets a user assemble what they will bring on a trip by adding bags and items, marking items as With Me or packed, and seeing progress.

## Requirements

### Requirement: Add a reusable bag to a trip
The system SHALL allow a user to add a reusable bag to a trip. Adding a bag SHALL copy the bag and its default contents into trip-scoped rows, so later edits to the library bag do not change the trip.

#### Scenario: Add a bag with default contents
- **WHEN** a user adds a library bag that has default contents to a trip
- **THEN** the trip gains a bag containing copies of those items with their quantities

#### Scenario: Add an empty bag
- **WHEN** a user adds a library bag with no default contents to a trip
- **THEN** the trip gains an empty bag

### Requirement: Add an item to a trip
The system SHALL allow a user to add a reusable item to a trip, optionally inside a trip bag, and SHALL allow adding an item that is not in the library.

#### Scenario: Add a library item to a trip
- **WHEN** a user adds a library item to a trip
- **THEN** the trip gains an entry for that item with its default quantity

#### Scenario: Add an ad-hoc item
- **WHEN** a user adds an item that is not in their library to a trip
- **THEN** the trip gains an entry for that item without affecting the library

### Requirement: Assign an item to a bag or With Me
The system SHALL place each trip entry in exactly one location: inside a trip bag, marked With Me, or loose (unassigned). Bag membership and With Me MUST be mutually exclusive.

#### Scenario: Move an item into a bag
- **WHEN** a user assigns a loose item to a trip bag
- **THEN** the item is shown inside that bag and is not marked With Me

#### Scenario: Mark an item With Me
- **WHEN** a user marks a trip entry as With Me
- **THEN** the item is shown in the With Me group and is removed from any bag

#### Scenario: Unassign an item
- **WHEN** a user removes an item from its bag and clears With Me
- **THEN** the item is shown as loose

### Requirement: Set an item's quantity
The system SHALL allow a user to change the quantity of a trip entry.

#### Scenario: Change quantity
- **WHEN** a user changes the quantity of a trip entry
- **THEN** the entry shows the new quantity

### Requirement: Reorder bags and items
The system SHALL allow a user to reorder bags and items within a trip by dragging, and SHALL preserve that order.

#### Scenario: Reorder items in a bag
- **WHEN** a user drags an item to a new position within a bag
- **THEN** the new order is saved and shown on reload

### Requirement: Mark items packed
The system SHALL allow a user to mark a trip entry as packed or unpacked. Packed state SHALL be stored per trip entry, not on the library item.

#### Scenario: Mark packed
- **WHEN** a user marks a trip entry as packed
- **THEN** the entry is recorded as packed for that trip only

#### Scenario: Library item unaffected
- **WHEN** a user marks a trip entry packed
- **THEN** the corresponding library item and other trips are unchanged

### Requirement: View packing progress
The system SHALL show packing progress for a trip as the count of packed entries against the total.

#### Scenario: Progress updates
- **WHEN** a user marks an entry packed or unpacked
- **THEN** the trip's progress reflects the change

#### Scenario: Empty packing list
- **WHEN** a trip has no entries
- **THEN** the system shows progress of zero of zero and an empty state

### Requirement: Remove an entry from a trip
The system SHALL allow a user to remove an entry from a trip without affecting the library.

#### Scenario: Remove an entry
- **WHEN** a user removes a trip entry
- **THEN** the entry is removed from the trip and the library is unchanged
