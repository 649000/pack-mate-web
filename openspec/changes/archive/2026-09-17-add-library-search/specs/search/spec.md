## Purpose

Lets a user find a trip, library item or library bag by name, from a single search dialog or from the list page itself, so a growing library stays quick to navigate.

## ADDED Requirements

### Requirement: Search the library by name

The system SHALL allow an authenticated user to search their trips, library items and library bags by name from the application's search dialog. Matching SHALL be a case-insensitive substring of the resource name. Results SHALL be grouped by type as Trips, Items and Bags. Search MUST NOT change any stored data and MUST NOT return resources belonging to another user.

#### Scenario: Query matches resources of several types

- **WHEN** a user types a query that matches a trip name, an item name and a bag name
- **THEN** the system shows the matches grouped under Trips, Items and Bags

#### Scenario: Query matches nothing

- **WHEN** a user types a query that matches no trip, item or bag
- **THEN** the system shows an empty state indicating no results

#### Scenario: Empty query

- **WHEN** the search dialog is open with no query
- **THEN** the system shows the navigation destinations instead of results

#### Scenario: Another user's resources are not searched

- **WHEN** a user searches for a name that only exists in another user's library
- **THEN** the system shows no match for it

### Requirement: Selecting a result opens the filtered list

The system SHALL allow a user to select a search result, and selecting it SHALL open the list page for that type with the search query applied.

#### Scenario: Selecting an item result

- **WHEN** a user selects an item result in the search dialog
- **THEN** the system opens the items list showing only items matching that query

#### Scenario: Selecting a trip result

- **WHEN** a user selects a trip result in the search dialog
- **THEN** the system opens the trips list showing only trips matching that query

#### Scenario: Selecting a bag result

- **WHEN** a user selects a bag result in the search dialog
- **THEN** the system opens the bags list showing only bags matching that query

### Requirement: List pages can be filtered by name

The trips, items and bags list pages SHALL each accept a name query and SHALL show only the entries whose name matches it, using the same case-insensitive substring matching as the search dialog. Each page SHALL show a search input reflecting the active query and SHALL allow the user to clear it, after which the full list is shown. Filtering MUST NOT change any stored data.

#### Scenario: List page opens with a query applied

- **WHEN** a list page is opened with a name query
- **THEN** the page shows only the entries whose name matches, and the search input shows the query

#### Scenario: No entries match

- **WHEN** the active query matches no entry on the list page
- **THEN** the page shows an empty state naming the query, without hiding the search input

#### Scenario: Clearing the query

- **WHEN** a user clears the query on a list page
- **THEN** the page shows the full list again

### Requirement: Name search composes with the item category filter

On the items list page, the name query and the existing category filter SHALL apply together, showing only items that satisfy both.

#### Scenario: Both filters active

- **WHEN** a user has a name query and a category selected on the items list
- **THEN** the page shows only items whose name matches the query and whose category matches the selected category

#### Scenario: Category filter unchanged by search

- **WHEN** a user applies a name query on the items list
- **THEN** the available category filter options are unchanged
