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

### Requirement: Record optional item details
The system SHALL allow an authenticated user to attach an optional description, link, and image URL to a reusable item, settable when creating or editing the item.

#### Scenario: Add details when creating an item
- **WHEN** a user creates an item with a description, link, and image URL
- **THEN** the item is stored with those details in their library

#### Scenario: Edit details on an existing item
- **WHEN** a user changes the description, link, or image URL of a library item
- **THEN** the library item is updated with the new details

#### Scenario: Clear details
- **WHEN** a user removes the description, link, or image URL from a library item
- **THEN** the item is stored without that detail

#### Scenario: Library detail edit does not change existing packing lists
- **WHEN** a user edits the details of a library item that has already been added to a trip
- **THEN** the trip's packing list entries are unchanged

### Requirement: Validate item details
The system SHALL reject a link or image URL that is not an absolute http or https URL, and SHALL reject a description longer than the allowed maximum.

#### Scenario: Reject a non-http link
- **WHEN** a user saves an item with a link that is not an http or https URL
- **THEN** the system rejects the request and does not save the link

#### Scenario: Reject a non-http image URL
- **WHEN** a user saves an item with an image URL that is not an http or https URL
- **THEN** the system rejects the request and does not save the image URL

#### Scenario: Reject an over-long description
- **WHEN** a user saves an item with a description longer than the allowed maximum
- **THEN** the system rejects the request and does not save the description

### Requirement: Validate item name length
The system SHALL reject a reusable item name longer than 200 characters, after trimming surrounding whitespace. The limit SHALL be enforced wherever an item is created or edited, including a direct database write.

#### Scenario: Reject an over-long item name
- **WHEN** a user saves an item with a name longer than 200 characters
- **THEN** the system rejects the request and does not save the item

#### Scenario: Accept a name at the maximum length
- **WHEN** a user saves an item with a name of exactly 200 characters
- **THEN** the item is saved with that name

#### Scenario: Reject an over-long name written directly to the database
- **WHEN** a name longer than 200 characters is written to an item without going through the application
- **THEN** the database rejects the write

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
The system SHALL reject a weight that is negative, not a number, or greater than 100000 grams.

#### Scenario: Reject a negative weight
- **WHEN** a user saves an item with a negative weight
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject a non-numeric weight
- **WHEN** a user saves an item with a weight that is not a number
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject an excessive weight
- **WHEN** a user saves an item with a weight greater than 100000 grams
- **THEN** the system rejects the request and does not save the weight

#### Scenario: Reject an excessive weight written directly to the database
- **WHEN** a weight greater than 100000 grams is written to an item without going through the application
- **THEN** the database rejects the write

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

### Requirement: Add an item to a trip from the library

The system SHALL let a user add a library item to one of their trips from the item library, without opening the trip first. The item SHALL be added to the chosen trip using the item's default quantity, unassigned, and SHALL appear on that trip.

#### Scenario: Add an item to a chosen trip

- **WHEN** a user chooses Add to trip on a library item and selects one of their trips
- **THEN** the item is added to that trip and a confirmation is shown

#### Scenario: No trips to add to

- **WHEN** a user chooses Add to trip and has no trips
- **THEN** the dialog explains that a trip is needed first and does not add anything

#### Scenario: A user cannot add to another user's trip

- **WHEN** an item is added to a trip the user does not own
- **THEN** the system rejects the request
