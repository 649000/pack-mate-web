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

### Requirement: Validate packing list name length
The system SHALL reject a trip bag or trip entry name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever a trip bag or entry is created or edited, including a direct database write.

#### Scenario: Reject an over-long trip entry name
- **WHEN** a user adds or renames a trip entry with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the entry

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves a trip entry with a name of exactly 200 characters
- **THEN** the entry is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to a trip bag or trip entry without going through the application
- **THEN** the database rejects the write

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
The system SHALL allow a user to reorder bags and items within a trip by dragging, and SHALL preserve that order. Bags SHALL be reordered among their siblings at the same level of nesting.

#### Scenario: Reorder items in a bag
- **WHEN** a user drags an item to a new position within a bag
- **THEN** the new order is saved and shown on reload

#### Scenario: Reorder sibling bags
- **WHEN** a user drags a nested bag to a new position among its siblings
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

### Requirement: Copy item details onto a trip
The system SHALL copy a reusable item's description, link, and image URL onto the trip entry when the item is added to a trip, including items added as part of a bag's default contents. Editing a trip entry's details SHALL NOT change the library item.

#### Scenario: Add an item with details to a trip
- **WHEN** a user adds a library item that has a description, link, or image URL to a trip
- **THEN** the trip entry carries copies of those details

#### Scenario: Add a bag with default contents
- **WHEN** a user adds a library bag whose default contents include items with details
- **THEN** the copied trip entries carry those details

#### Scenario: Editing a trip entry's details does not change the library
- **WHEN** a user edits the details of a trip entry
- **THEN** the corresponding library item is unchanged

### Requirement: Find an entry in a trip
The system SHALL allow a user to search the entries of a trip by name and SHALL show, for each match, where the entry is located: inside a bag, marked With Me, or unassigned.

#### Scenario: Search finds entries by name
- **WHEN** a user types part of an entry's name in the trip search
- **THEN** the system shows the trip entries whose name matches, ignoring letter case

#### Scenario: Result shows the entry's location
- **WHEN** the system shows a matching entry
- **THEN** the result shows the bag name, "With Me", or an unassigned label as appropriate

#### Scenario: No matches
- **WHEN** a user searches for text that matches no entry in the trip
- **THEN** the system shows an empty result state

#### Scenario: Clearing the search
- **WHEN** a user clears the search
- **THEN** the system shows the trip without the search filter applied

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

### Requirement: Nest a bag inside another bag
The system SHALL allow a trip bag to belong to another trip bag, at most one parent, and SHALL allow a nested bag to be moved back to the top level. Library bags SHALL NOT be nested.

#### Scenario: Move a bag into another bag
- **WHEN** a user assigns a trip bag to a parent trip bag
- **THEN** the bag is shown inside its parent

#### Scenario: Move a bag to the top level
- **WHEN** a user removes a trip bag's parent
- **THEN** the bag is shown at the top level

#### Scenario: A bag cannot contain itself or its own descendant
- **WHEN** a user tries to assign a bag to itself or to one of its descendants
- **THEN** the system rejects the change and leaves the nesting unchanged

#### Scenario: A parent must belong to the same trip
- **WHEN** a user tries to assign a trip bag to a bag from another trip
- **THEN** the system rejects the change

### Requirement: Show nested bags as a tree
The system SHALL display trip bags as a tree that reflects their nesting.

#### Scenario: Nested bags are shown under their parent
- **WHEN** a trip has nested bags
- **THEN** each bag is shown under its parent and its entries are grouped with it

### Requirement: Show an entry's full location path
The system SHALL show an entry's location as the full path of bags that contain it, or as With Me or unassigned.

#### Scenario: Entry inside nested bags
- **WHEN** an entry is inside a bag that is inside another bag
- **THEN** the system shows the location as the chain of bag names from the outermost bag to the innermost

#### Scenario: Entry at the top level of a bag
- **WHEN** an entry is inside a top-level bag
- **THEN** the system shows that bag's name

#### Scenario: Entry not in a bag
- **WHEN** an entry is marked With Me or is unassigned
- **THEN** the system shows With Me or the unassigned label

### Requirement: Include nested bags in bag weight
When a bag has a weight, the system SHALL include the weight of bags nested inside it, counting each entry exactly once. The trip's total baggage weight SHALL sum only top-level bags.

#### Scenario: Parent weight includes nested bags
- **WHEN** a bag contains entries and also contains a nested bag with entries
- **THEN** the parent bag's weight is the sum of its own entries plus the nested bag's weight

#### Scenario: Trip total counts each entry once
- **WHEN** a trip has nested bags
- **THEN** the total baggage weight sums the top-level bags only, so nested entries are not counted twice

#### Scenario: Incomplete nested weight
- **WHEN** any entry inside a bag or its nested bags has no weight
- **THEN** the bag's weight is marked incomplete

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

### Requirement: Bulk pack or unpack a trip's entries

The system SHALL allow a user to mark all of a trip's entries as packed, or all of them as unpacked, in a single action. A bulk action SHALL apply to the whole trip and MUST NOT be limited to the entries currently shown by the search, category or packed filters, and its label SHALL state how many entries it affects. A bulk action MUST NOT change any entry's quantity, weight, category or location, and MUST NOT change packing progress except by the packed count. After a bulk action the system SHALL offer an undo, and undoing SHALL restore each affected entry's previous packed state exactly, including a mix of packed and unpacked entries. The undo offer SHALL be transient; once it expires the change stands. The system SHALL reject an attempt to bulk-change another user's trip.

#### Scenario: Pack all entries

- **WHEN** a user chooses to pack all entries on a trip
- **THEN** every entry on the trip is marked packed and the progress count reflects all entries

#### Scenario: Unpack all entries

- **WHEN** a user chooses to unpack all entries on a trip
- **THEN** every entry on the trip is marked unpacked and the progress count reflects none packed

#### Scenario: Bulk action ignores active filters

- **WHEN** a user has filtered the trip to a category, search term or packed state and chooses a bulk action
- **THEN** the action applies to every entry on the trip, not only the entries shown

#### Scenario: Undo restores the previous per-entry state

- **WHEN** a trip has some entries already packed and the user packs all, then undoes
- **THEN** exactly the entries that were packed before remain packed and the rest are unpacked

#### Scenario: Undo offer expires

- **WHEN** the undo offer has expired without being used
- **THEN** the bulk change remains and no undo is available

#### Scenario: Bulk change does not alter entries beyond packed state

- **WHEN** a user performs a bulk pack or unpack
- **THEN** no entry's quantity, weight, category or location changes

#### Scenario: Cannot bulk-change another user's trip

- **WHEN** a user attempts a bulk action on a trip they do not own
- **THEN** the system rejects the request and changes nothing

### Requirement: A packing-list entry shows its weight

The system SHALL show an entry's weight in its row when the entry has one, in the user's chosen unit, without disturbing the row's existing controls.

#### Scenario: Entry with a weight

- **WHEN** a user views a packing-list entry that has a weight
- **THEN** the entry's weight is shown in its row

#### Scenario: Entry without a weight

- **WHEN** a user views a packing-list entry that has no weight
- **THEN** no weight is shown for that entry
