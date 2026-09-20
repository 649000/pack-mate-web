## ADDED Requirements

### Requirement: Content surfaces use the theme component that fits the feature

The authenticated app's content surfaces SHALL present data using the theme's components, choosing the component that matches the feature rather than a single generic layout, and SHALL adapt those components to Pack Mate's data rather than introducing bespoke equivalents.

#### Scenario: A list surface presents records in the theme's data table

- **WHEN** the user views the trips, bags, items or shared links surface
- **THEN** the records are presented in the theme's data table with a toolbar, column headers and per-row actions

#### Scenario: A packing list shows every group together

- **WHEN** the user views a trip's packing list
- **THEN** its bags, With Me items and unassigned items are all presented together as sections, without any group being hidden behind a tab and without each entry being drawn as a nested bordered box

#### Scenario: Reordering keeps working with the theme's row treatment

- **WHEN** the user reorders entries within a packing list group
- **THEN** the reorder is performed by dragging a row that uses the theme's row treatment

### Requirement: List surfaces support finding and organising records

Each list surface SHALL let the user narrow and organise its records using the theme's data table capabilities, so a growing library stays workable.

#### Scenario: Search narrows the records

- **WHEN** the user types a query into a list surface's toolbar search
- **THEN** the table shows only records matching the query

#### Scenario: Columns can be sorted

- **WHEN** the user activates a sortable column header
- **THEN** the table orders its records by that column

#### Scenario: Columns can be hidden

- **WHEN** the user hides a column through the table's column controls
- **THEN** that column is no longer shown

### Requirement: Surfaces present loading and empty states from the visual system

Surfaces SHALL communicate loading and absence of data using the visual system's components, not bare text.

#### Scenario: Loading shows placeholders

- **WHEN** a surface is loading its records
- **THEN** it shows the theme's skeleton placeholders rather than a text-only loading message

#### Scenario: Empty surface offers a next step

- **WHEN** a surface has no records to show
- **THEN** it shows an empty state with an explanation and a way to create the first record

### Requirement: The packing list is the dominant content on a trip

A trip surface SHALL present the packing list as its primary content, keeping summary and controls compact so the list is not pushed below layers of chrome.

#### Scenario: Summary and controls stay compact

- **WHEN** the user opens a trip
- **THEN** the packing progress, baggage total, list search and adding occupy no more than a compact summary and a single action row above the list

#### Scenario: Reference detail is collapsed

- **WHEN** the user opens a trip
- **THEN** the weight-by-category breakdown stays collapsed until the user opens it

### Requirement: Records are scannable through imagery, icons and status

Records SHALL be distinguishable at a glance using the visual system's imagery, icons, badges and progress indicators, and actions SHALL be identifiable by icon as well as label.

#### Scenario: An item shows its identity

- **WHEN** the user views an item in a list surface
- **THEN** the item shows its image or a category representation alongside its name and category

#### Scenario: A bag in a packing list shows its weight against its limit

- **WHEN** the user views a bag with a weight limit in a trip's packing list
- **THEN** the bag shows its used weight against that limit

#### Scenario: A bag in the library shows its limit

- **WHEN** the user views a bag with a weight limit in the bag library
- **THEN** the bag shows that limit as a labelled value

#### Scenario: A packing list group is identifiable by icon

- **WHEN** the user views a group of a packing list
- **THEN** the group shows an icon identifying it as a bag, as With Me items or as unassigned items

#### Scenario: Actions are identifiable by icon

- **WHEN** the user views the actions available on a record
- **THEN** each action is presented with an icon and an accessible name

### Requirement: Public shared page reuses the visual system read-only

The public shared trip page SHALL present a trip using the same visual system components as the authenticated app, read-only, without editing controls and with a route into the product.

#### Scenario: A visitor views a shared list

- **WHEN** a visitor opens a shared link
- **THEN** the trip is presented read-only using the same components, with no editing controls

#### Scenario: A visitor can reach the product

- **WHEN** a visitor views a shared list
- **THEN** the page offers a way to create their own list
