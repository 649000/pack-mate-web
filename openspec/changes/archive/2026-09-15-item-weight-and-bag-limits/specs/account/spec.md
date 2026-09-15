## ADDED Requirements

### Requirement: User can choose a weight unit
The system SHALL let an authenticated user choose their preferred weight unit, kilograms or pounds, defaulting to kilograms. The preference affects how weights are entered and displayed; stored weights remain canonical grams.

#### Scenario: Default unit is kilograms
- **WHEN** an authenticated user has never chosen a unit
- **THEN** the system uses kilograms for entry and display

#### Scenario: Change the unit
- **WHEN** an authenticated user selects pounds
- **THEN** the system stores the preference and uses pounds for entry and display

#### Scenario: Preference persists
- **WHEN** an authenticated user returns after choosing a unit
- **THEN** the system uses their saved unit

#### Scenario: Preference applies across trips
- **WHEN** an authenticated user with a saved unit opens any trip
- **THEN** weights are shown in that unit unless the trip view's toggle is changed
