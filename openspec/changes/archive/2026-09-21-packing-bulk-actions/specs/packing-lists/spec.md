## ADDED Requirements

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
