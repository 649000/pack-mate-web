# design-system Specification

## Purpose

Defines the application's visual system: the shell and page chrome used throughout the authenticated app, and the public marketing landing page, both derived from the licensed Metronic reference.

## Requirements

### Requirement: Authenticated app uses a consistent application shell

Every authenticated page SHALL render inside a single shared application shell that provides primary navigation and a signed-in header, rather than each page composing its own chrome.

#### Scenario: Shell wraps every authenticated page

- **WHEN** the user visits any authenticated page (trips, bags, items, or a trip)
- **THEN** the page renders inside the shared shell with the same primary navigation and header

#### Scenario: Primary navigation moves between areas

- **WHEN** the user selects an area from the shell navigation
- **THEN** the app navigates to that area and marks it as the current location

### Requirement: Primary navigation adapts to screen size

On small screens the primary navigation SHALL remain reachable without a permanently visible sidebar, and on larger screens it SHALL be presented as persistent chrome.

#### Scenario: Small screen navigation

- **WHEN** the app is viewed at a mobile width
- **THEN** the persistent sidebar is not shown and the user can open the primary navigation from a visible control

#### Scenario: Large screen navigation

- **WHEN** the app is viewed at a desktop width
- **THEN** the primary navigation is visible without an extra action

### Requirement: Landing page presents the full marketing experience

The public landing page SHALL present the complete marketing experience from the reference template, including a header, hero, and the template's supporting marketing sections, rather than a placeholder page.

#### Scenario: Landing shows the marketing sections

- **WHEN** a visitor opens the landing page
- **THEN** they see the header, hero, and the template's supporting sections (such as how it works, features, pricing, FAQ and footer)

#### Scenario: Landing remains public

- **WHEN** an unauthenticated visitor opens the landing page
- **THEN** it renders without requiring sign-in

### Requirement: Landing calls to action lead to sign-in

Calls to action on the landing page SHALL lead visitors into the existing sign-in flow.

#### Scenario: Visitor acts on a call to action

- **WHEN** a visitor activates a primary call to action on the landing page
- **THEN** the app navigates to the sign-in page

### Requirement: Visual system is consistent across app and landing

The app and the landing page SHALL use the reference design system's token base and component appearance, so interactive controls look consistent throughout.

#### Scenario: Shared controls use the reference appearance

- **WHEN** the user interacts with controls such as buttons, inputs, cards and dialogs
- **THEN** they match the reference design system's appearance and token base

### Requirement: Interface is usable on mobile and desktop

The shell and the landing page SHALL remain usable at mobile and desktop widths, without horizontal overflow and with all navigation and content reachable.

#### Scenario: Mobile width

- **WHEN** the app and landing page are viewed at a mobile width
- **THEN** content fits the viewport, there is no horizontal overflow, and navigation is reachable

#### Scenario: Desktop width

- **WHEN** the app and landing page are viewed at a desktop width
- **THEN** content is laid out for the larger viewport and remains legible

### Requirement: Paid template source is not committed

The repository SHALL NOT contain the paid template source; only application code derived from it SHALL be committed.

#### Scenario: Template source stays out of the repository

- **WHEN** the repository contents and build output are inspected
- **THEN** the paid template source is absent and only derived application code is present

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
