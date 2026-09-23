## Purpose

Defines the application's visual system: the shell and page chrome used throughout the authenticated app, the signed-in home, the library surfaces, and the public marketing landing page, all derived from the Stitch design systems (Kinetic Utility for light, Kinetic Manifest for dark).

## MODIFIED Requirements

### Requirement: Authenticated app uses a consistent application shell

Every authenticated page SHALL render inside a single shared application shell that provides primary navigation and a signed-in header, rather than each page composing its own chrome. The shell SHALL follow the Stitch navigation design: a horizontal top navigation bar on large screens, and a compact app bar with a bottom tab bar on small screens. The shell SHALL NOT present a notifications control, because Pack Mate has no notifications.

#### Scenario: Shell wraps every authenticated page

- **WHEN** the user visits any authenticated page (the dashboard, trips, bags, items, shared links, or a trip)
- **THEN** the page renders inside the shared shell with the same primary navigation and header

#### Scenario: Primary navigation moves between areas

- **WHEN** the user selects an area from the shell navigation
- **THEN** the app navigates to that area and marks it as the current location

#### Scenario: Desktop navigation is horizontal

- **WHEN** the app is viewed at a desktop width
- **THEN** the primary navigation is presented as a horizontal top bar with the areas Dashboard, Trips, Bag Library, Items Library and Shared Links, along with global search, a create action and the account control

#### Scenario: No notifications control

- **WHEN** the user views the shell at any width
- **THEN** there is no notifications control; the account control holds account, theme and sign-out

### Requirement: Content surfaces use the theme component that fits the feature

The authenticated app's content surfaces SHALL present data using the component that matches the feature rather than a single generic layout, and SHALL adapt that component to Pack Mate's data rather than introducing bespoke equivalents. The trips surface SHALL present trips as a management list; the bag library SHALL present bags as cards; the item library SHALL present items as a table; and the shared-link surface SHALL present records in a list. A record SHALL be activatable by activating the record itself or its title, and not only through a separate action.

#### Scenario: A list surface presents records in the theme's data table

- **WHEN** the user views the bags, items or shared links surface
- **THEN** the records are presented as cards or a table with headers and per-row actions

#### Scenario: The trips surface presents trips as cards

- **WHEN** the user views the trips surface
- **THEN** each trip is presented as a card showing its destination, dates and status, grouped into current/upcoming and past sections with a featured next departure

#### Scenario: A trip is opened by activating its card

- **WHEN** the user activates a trip's card or its name
- **THEN** the app opens that trip, while the card's own actions remain usable

#### Scenario: The bag library shows default contents

- **WHEN** the user views the bag library
- **THEN** each bag is a card showing its default contents and its weight limit

#### Scenario: The item library shows item detail

- **WHEN** the user views the item library
- **THEN** each item is a table row showing its identity, specification, category, default quantity and mass

#### Scenario: A packing list shows every group together

- **WHEN** the user views a trip's packing list
- **THEN** its bags, With Me items and unassigned items are all presented together as sections, without any group being hidden behind a tab and without each entry being drawn as a nested bordered box

#### Scenario: Reordering keeps working with the theme's row treatment

- **WHEN** the user reorders entries within a packing list group
- **THEN** the reorder is performed by dragging a row that uses the theme's row treatment

### Requirement: The signed-in app presents a read-only summary home

The signed-in app SHALL present a summary home at the dashboard that composes existing trip data read-only — the number of trips, active and upcoming trips, the next journey with packing progress and weight against bag limits, and a list of upcoming and recent trips — without introducing new data, writes or domain concepts. When the next journey has no items, the progress summary SHALL indicate that rather than showing a bare zero.

#### Scenario: A user opens the summary home

- **WHEN** a signed-in user opens the dashboard
- **THEN** it shows a summary of their trips drawn from data the app already holds, and a route into a trip

#### Scenario: The summary home does not change data

- **WHEN** the summary home is displayed or used
- **THEN** no trip, bag, item or packing state is created or modified

## ADDED Requirements

### Requirement: List surfaces support searching, sorting and filtering

Each list surface SHALL let the user narrow and order its records so a growing library stays workable: a text search, and either column sorting or a sort control; the item library SHALL additionally be filterable by category.

#### Scenario: Search narrows the records

- **WHEN** the user types a query into a list surface's search
- **THEN** the surface shows only records matching the query

#### Scenario: Records can be ordered

- **WHEN** the user uses the surface's sort control or sortable header
- **THEN** the surface orders its records accordingly

#### Scenario: The item library can be filtered by category

- **WHEN** the user selects a category filter on the item library
- **THEN** only items in that category are shown

## REMOVED Requirements

### Requirement: List surfaces support finding and organising records

**Reason**: Superseded by "List surfaces support searching, sorting and filtering". The list surfaces no longer expose a column-visibility control, matching the Stitch design; search, sorting and category filtering remain.
