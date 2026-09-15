## ADDED Requirements

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
