## MODIFIED Requirements

### Requirement: Content surfaces use the theme component that fits the feature

The authenticated app's content surfaces SHALL present data using the component that matches the feature rather than a single generic layout, and SHALL adapt that component to Pack Mate's data rather than introducing bespoke equivalents. The trips surface SHALL present trips as cards; the bag, item and shared-link surfaces SHALL present records in a list or table treatment. A record SHALL be activatable by activating the record itself or its title, and not only through a separate action.

#### Scenario: A list surface presents records in the theme's data table

- **WHEN** the user views the bags, items or shared links surface
- **THEN** the records are presented in the theme's list or table with a toolbar, headers and per-row actions

#### Scenario: The trips surface presents trips as cards

- **WHEN** the user views the trips surface
- **THEN** each trip is presented as a card showing its destination, dates and status

#### Scenario: A trip is opened by activating its card

- **WHEN** the user activates a trip's card or its name
- **THEN** the app opens that trip, while the card's own actions remain usable

#### Scenario: A packing list shows every group together

- **WHEN** the user views a trip's packing list
- **THEN** its bags, With Me items and unassigned items are all presented together as sections, without any group being hidden behind a tab and without each entry being drawn as a nested bordered box

#### Scenario: Reordering keeps working with the theme's row treatment

- **WHEN** the user reorders entries within a packing list group
- **THEN** the reorder is performed by dragging a row that uses the theme's row treatment
