## MODIFIED Requirements

### Requirement: Shared view shows the packing list
The shared view SHALL show the trip's name, dates, destination and country name, its bags including nested bags, and its entries grouped by location: inside a bag, marked With Me, or unassigned. For each entry it SHALL show the name, quantity and packed state, and the description, link and image URL when set. It SHALL show packing progress and, for each bag, the bag's weight, weight limit and whether it is under or over that limit.

#### Scenario: Trip details and grouping
- **WHEN** a visitor opens a valid link
- **THEN** the system shows the trip name, dates, destination and country name, with entries grouped by their bag, With Me, or unassigned

#### Scenario: Nested bags
- **WHEN** the trip has a bag nested inside another bag
- **THEN** the shared view shows that nesting

#### Scenario: Entry details
- **WHEN** a trip entry has a description, link or image URL
- **THEN** the shared view shows those details

#### Scenario: Progress and weights
- **WHEN** a visitor opens a valid link
- **THEN** the system shows packing progress and each bag's weight against its limit where set

#### Scenario: Empty packing list
- **WHEN** a shared trip has no entries
- **THEN** the system shows the trip with an empty state
