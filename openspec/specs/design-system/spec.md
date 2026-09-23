# design-system Specification

## Purpose

Defines the application's visual system: the shell and page chrome used throughout the authenticated app, the signed-in home, the library surfaces, and the public marketing landing page, all derived from the Stitch design systems (Kinetic Utility for light, Kinetic Manifest for dark).

## Requirements

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

### Requirement: Primary navigation adapts to screen size

On small screens the primary navigation SHALL remain reachable without a permanently visible sidebar, and on larger screens it SHALL be presented as persistent chrome. On small screens the app SHALL present a bottom tab bar for the primary areas and a top app bar for the account and secondary areas.

#### Scenario: Small screen navigation

- **WHEN** the app is viewed at a mobile width
- **THEN** the persistent sidebar is not shown and the primary areas are reachable from a bottom tab bar, with the account and shared links reachable from the top app bar

#### Scenario: Large screen navigation

- **WHEN** the app is viewed at a desktop width
- **THEN** the primary navigation is visible without an extra action

### Requirement: Landing page presents the full marketing experience

The public landing page SHALL present the complete marketing experience in the Stitch landing design, including a header, hero, and the design's supporting marketing sections, rather than a placeholder page.

#### Scenario: Landing shows the marketing sections

- **WHEN** a visitor opens the landing page
- **THEN** they see the header, hero, and the design's supporting sections (such as the product showcase, features, comparison, peace-of-mind steps and footer)

#### Scenario: Landing remains public

- **WHEN** an unauthenticated visitor opens the landing page
- **THEN** it renders without requiring sign-in

### Requirement: Landing calls to action lead to sign-in

Calls to action on the landing page SHALL lead visitors into the existing sign-in flow.

#### Scenario: Visitor acts on a call to action

- **WHEN** a visitor activates a primary call to action on the landing page
- **THEN** the app navigates to the sign-in page

### Requirement: Visual system is consistent across app and landing

The app and the landing page SHALL use the Stitch design systems' token base and component appearance, so interactive controls look consistent throughout, in both light and dark themes.

#### Scenario: Shared controls use the reference appearance

- **WHEN** the user interacts with controls such as buttons, inputs, cards and dialogs
- **THEN** they match the Stitch design system's appearance and token base

### Requirement: Interface is usable on mobile and desktop

The shell and the landing page SHALL remain usable at mobile and desktop widths, without horizontal overflow and with all navigation and content reachable.

#### Scenario: Mobile width

- **WHEN** the app and landing page are viewed at a mobile width
- **THEN** content fits the viewport, there is no horizontal overflow, and navigation is reachable

#### Scenario: Desktop width

- **WHEN** the app and landing page are viewed at a desktop width
- **THEN** content is laid out for the larger viewport and remains legible

### Requirement: Paid template source is not committed

The repository SHALL NOT contain third-party template or design-tool source; only application code derived from it, or written for Pack Mate, SHALL be committed.

#### Scenario: Template source stays out of the repository

- **WHEN** the repository contents and build output are inspected
- **THEN** no third-party template source is present and only derived application code is present

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

### Requirement: The visual system provides light and dark themes

The application SHALL define both a light theme and a dark theme drawn from the Stitch design systems, and SHALL apply the user's chosen theme across the shell, the content surfaces, the auth pages and the landing page.

#### Scenario: Light theme

- **WHEN** the light theme is active
- **THEN** the app uses the light palette, typography and elevation

#### Scenario: Dark theme

- **WHEN** the dark theme is active
- **THEN** the app uses the dark palette, typography and elevation, and numeric values use the monospace numeric face

### Requirement: The signed-in app presents a read-only summary home

The signed-in app SHALL present a summary home at the dashboard that composes existing trip data read-only — the number of trips, active and upcoming trips, the next journey with packing progress and weight against bag limits, and a list of upcoming and recent trips — without introducing new data, writes or domain concepts. When the next journey has no items, the progress summary SHALL indicate that rather than showing a bare zero.

#### Scenario: A user opens the summary home

- **WHEN** a signed-in user opens the dashboard
- **THEN** it shows a summary of their trips drawn from data the app already holds, and a route into a trip

#### Scenario: The summary home does not change data

- **WHEN** the summary home is displayed or used
- **THEN** no trip, bag, item or packing state is created or modified

### Requirement: Error pages are presented in the visual system

The application SHALL provide not-found and error pages that use the visual system and offer a route back into the product, rather than the browser's default error output.

#### Scenario: A missing route is shown

- **WHEN** a visitor requests a route that does not exist
- **THEN** they see a not-found page in the visual system with a route back to the app

#### Scenario: An unexpected error is shown

- **WHEN** the app encounters an unexpected error
- **THEN** the user sees an error page in the visual system with a route back to the app

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

### Requirement: The chosen theme persists for the user

The system SHALL persist a signed-in user's light or dark theme choice on their account and SHALL apply it when they use the app, so the choice follows them across desktop and mobile rather than living only on one device.

#### Scenario: Choose a theme

- **WHEN** a signed-in user switches between light and dark
- **THEN** the choice is stored on their account and applied

#### Scenario: Theme follows the user to another device

- **WHEN** a signed-in user opens the app on another device
- **THEN** their stored theme is applied

#### Scenario: Default theme

- **WHEN** a user has never chosen a theme
- **THEN** the app uses the default light theme

#### Scenario: An invalid theme is rejected

- **WHEN** a theme other than light or dark is written to a profile
- **THEN** the system rejects the write
