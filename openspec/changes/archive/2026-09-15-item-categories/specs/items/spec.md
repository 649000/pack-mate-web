## ADDED Requirements

### Requirement: Record item category

The system SHALL allow an authenticated user to attach an optional category to a reusable item, settable when creating or editing the item. The category SHALL be one of a fixed set of everyday-travel categories, or unset. The system MUST reject a category outside that fixed set.

#### Scenario: Set a category when creating an item

- **WHEN** a user creates an item and selects a category from the fixed set
- **THEN** the item is stored with that category in their library

#### Scenario: Change a category

- **WHEN** a user selects a different category for an existing library item
- **THEN** the library item is updated with the new category

#### Scenario: Clear a category

- **WHEN** a user removes the category from a library item
- **THEN** the item is stored as uncategorised

#### Scenario: Category is optional

- **WHEN** a user creates an item without selecting a category
- **THEN** the system creates the item as uncategorised

#### Scenario: Reject an unknown category

- **WHEN** a user saves an item with a category that is not in the fixed set
- **THEN** the system rejects the request and does not save the category

#### Scenario: Library category edit does not change existing packing lists

- **WHEN** a user changes the category of a library item that has already been added to a trip
- **THEN** the trip's packing list entries are unchanged

### Requirement: Filter library items by category

The system SHALL allow a user to filter their library by category, showing only items in the selected category. The filter SHALL offer only the categories present in the library, plus an option for uncategorised items. Filtering MUST NOT change any stored item.

#### Scenario: Filter the library by a category

- **WHEN** a user selects a category in the library
- **THEN** the system shows only the library items in that category

#### Scenario: Offer only categories in use

- **WHEN** a user opens the library filter
- **THEN** the system offers only the categories present in the library, plus an uncategorised option when such items exist

#### Scenario: Clear the library filter

- **WHEN** a user clears the category filter
- **THEN** the system shows the full library again

#### Scenario: No items in a category

- **WHEN** a user selects a category with no items
- **THEN** the system shows an empty result state
