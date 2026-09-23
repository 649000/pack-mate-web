## ADDED Requirements

### Requirement: A packing-list entry shows its weight

The system SHALL show an entry's weight in its row when the entry has one, in the user's chosen unit, without disturbing the row's existing controls.

#### Scenario: Entry with a weight

- **WHEN** a user views a packing-list entry that has a weight
- **THEN** the entry's weight is shown in its row

#### Scenario: Entry without a weight

- **WHEN** a user views a packing-list entry that has no weight
- **THEN** no weight is shown for that entry
