# library-picker Specification

## Purpose

Lets a user choose one of their own library items or bags by typing, wherever a library item or bag is selected into a trip or a bag's default contents, so a growing library stays quick to pick from.

## Requirements

### Requirement: Library choices can be filtered by typing

Wherever the user selects a library item or a library bag, the system SHALL provide a control that filters the available choices by name as the user types. Matching SHALL be a case-insensitive substring of the name, so a query MAY match anywhere within a name rather than only at its start.

#### Scenario: Query matches part of a name

- **WHEN** a user types a query that appears in the middle of a library entry's name
- **THEN** the system offers that entry among the choices

#### Scenario: Matching ignores letter case

- **WHEN** a user types a query whose letters differ in case from a library entry's name
- **THEN** the system offers that entry among the choices

#### Scenario: Clearing the query

- **WHEN** a user clears the typed query
- **THEN** the system offers the full set of choices again

### Requirement: The picker offers only the user's own library entries

The picker SHALL present only entries from the authenticated user's own library. It MUST NOT offer another user's items or bags.

#### Scenario: Another user's entry is never offered

- **WHEN** a user's library does not contain an entry with a given name but another user's library does
- **THEN** the picker does not offer that entry for any query

#### Scenario: Empty library

- **WHEN** a user has no library items or no library bags, as appropriate to the picker
- **THEN** the picker indicates that there is nothing to choose

### Requirement: A query with no matches is explained

When the typed query matches no library entry, the picker SHALL show a no-match state rather than an empty list, and the user SHALL be able to clear the query and choose again.

#### Scenario: No matching entry

- **WHEN** a user types a query that matches none of their library entries
- **THEN** the picker shows a no-match state and the query can be cleared

### Requirement: Choosing is explicit and does not change data until confirmed

Typing or browsing choices MUST NOT change any stored data. Only when the user confirms a choice SHALL the entry be added, and the result SHALL be the same as choosing that entry through the picker it replaces: a library item is added with its default quantity, and a library bag is copied with its default contents.

#### Scenario: Filtering alone changes nothing

- **WHEN** a user types a query in the picker without confirming a choice
- **THEN** no trip entry, trip bag or bag default content is created or changed

#### Scenario: Confirming a library item

- **WHEN** a user confirms a library item through the picker
- **THEN** the item is added with its default quantity, exactly as before

#### Scenario: Confirming a library bag

- **WHEN** a user confirms a library bag through the picker
- **THEN** the bag is copied with its default contents, exactly as before

### Requirement: The picker is operable by keyboard and by touch

The picker SHALL be usable without a pointer and on small screens: the user SHALL be able to move between matching choices, confirm a choice, and dismiss the picker without selecting anything.

#### Scenario: Keyboard selection

- **WHEN** a user moves through the matching choices with the keyboard and confirms one
- **THEN** that choice is selected

#### Scenario: Dismissing without selecting

- **WHEN** a user dismisses the picker without confirming a choice
- **THEN** nothing is added or changed

#### Scenario: Small screen

- **WHEN** the picker is used at a mobile width
- **THEN** it can be opened, filtered and confirmed by touch without horizontal overflow
