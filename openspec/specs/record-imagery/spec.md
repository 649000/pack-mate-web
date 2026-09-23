# record-imagery Specification

## Purpose
Identifies records at a glance using icons and flags derived from data the app already holds, without introducing new persisted state.

## Requirements

### Requirement: Items are identified by their category icon

The system SHALL display an icon representing an item's category wherever the item is listed, alongside the category label, so items are distinguishable at a glance. An item with no category SHALL show a neutral placeholder icon.

#### Scenario: Item with a category shows its icon

- **WHEN** a user views an item that has a category
- **THEN** an icon representing that category is shown next to the item

#### Scenario: Every defined category has an icon

- **WHEN** the system defines a set of item categories
- **THEN** each category is mapped to an icon

#### Scenario: Item without a category

- **WHEN** a user views an item that has no category
- **THEN** a neutral placeholder icon is shown

### Requirement: Trips show their destination country's flag

The system SHALL display the destination country's flag for a trip wherever the trip is presented, including the trips list, a trip's header, the dashboard and the public shared view. The flag SHALL render consistently on desktop and mobile and SHALL be hidden from assistive technology, with the country name available as text.

#### Scenario: Trip with a known country shows its flag

- **WHEN** a user views a trip whose country code the system can render
- **THEN** that country's flag is shown for the trip

#### Scenario: Flag is decorative and the country is named

- **WHEN** a flag is shown
- **THEN** it is hidden from assistive technology and the country name remains available as text

#### Scenario: Unknown country code

- **WHEN** a trip's country code cannot be rendered as a flag
- **THEN** the interface shows a neutral fallback and never a broken image

### Requirement: Imagery is derived, not stored

Category icons and country flags SHALL be derived from existing data — an item's category and a trip's country code — and SHALL NOT require new persisted state.

#### Scenario: No new stored imagery

- **WHEN** a user creates or edits an item or a trip
- **THEN** no icon or flag choice is persisted
