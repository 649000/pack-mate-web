## ADDED Requirements

### Requirement: Nest a bag inside another bag
The system SHALL allow a trip bag to belong to another trip bag, at most one parent, and SHALL allow a nested bag to be moved back to the top level. Library bags SHALL NOT be nested.

#### Scenario: Move a bag into another bag
- **WHEN** a user assigns a trip bag to a parent trip bag
- **THEN** the bag is shown inside its parent

#### Scenario: Move a bag to the top level
- **WHEN** a user removes a trip bag's parent
- **THEN** the bag is shown at the top level

#### Scenario: A bag cannot contain itself or its own descendant
- **WHEN** a user tries to assign a bag to itself or to one of its descendants
- **THEN** the system rejects the change and leaves the nesting unchanged

#### Scenario: A parent must belong to the same trip
- **WHEN** a user tries to assign a trip bag to a bag from another trip
- **THEN** the system rejects the change

### Requirement: Show nested bags as a tree
The system SHALL display trip bags as a tree that reflects their nesting.

#### Scenario: Nested bags are shown under their parent
- **WHEN** a trip has nested bags
- **THEN** each bag is shown under its parent and its entries are grouped with it

### Requirement: Show an entry's full location path
The system SHALL show an entry's location as the full path of bags that contain it, or as With Me or unassigned.

#### Scenario: Entry inside nested bags
- **WHEN** an entry is inside a bag that is inside another bag
- **THEN** the system shows the location as the chain of bag names from the outermost bag to the innermost

#### Scenario: Entry at the top level of a bag
- **WHEN** an entry is inside a top-level bag
- **THEN** the system shows that bag's name

#### Scenario: Entry not in a bag
- **WHEN** an entry is marked With Me or is unassigned
- **THEN** the system shows With Me or the unassigned label

### Requirement: Include nested bags in bag weight
When a bag has a weight, the system SHALL include the weight of bags nested inside it, counting each entry exactly once. The trip's total baggage weight SHALL sum only top-level bags.

#### Scenario: Parent weight includes nested bags
- **WHEN** a bag contains entries and also contains a nested bag with entries
- **THEN** the parent bag's weight is the sum of its own entries plus the nested bag's weight

#### Scenario: Trip total counts each entry once
- **WHEN** a trip has nested bags
- **THEN** the total baggage weight sums the top-level bags only, so nested entries are not counted twice

#### Scenario: Incomplete nested weight
- **WHEN** any entry inside a bag or its nested bags has no weight
- **THEN** the bag's weight is marked incomplete

## MODIFIED Requirements

### Requirement: Reorder bags and items
The system SHALL allow a user to reorder bags and items within a trip by dragging, and SHALL preserve that order. Bags SHALL be reordered among their siblings at the same level of nesting.

#### Scenario: Reorder items in a bag
- **WHEN** a user drags an item to a new position within a bag
- **THEN** the new order is saved and shown on reload

#### Scenario: Reorder sibling bags
- **WHEN** a user drags a nested bag to a new position among its siblings
- **THEN** the new order is saved and shown on reload
