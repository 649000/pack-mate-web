## MODIFIED Requirements

### Requirement: Authenticated app uses a consistent application shell

Every authenticated page SHALL render inside a single shared application shell that provides primary navigation and a signed-in header, rather than each page composing its own chrome. The shell SHALL follow the Stitch navigation design: a horizontal top navigation bar on large screens, and a compact app bar with a bottom tab bar on small screens.

#### Scenario: Shell wraps every authenticated page

- **WHEN** the user visits any authenticated page (the dashboard, trips, bags, items, shared links, or a trip)
- **THEN** the page renders inside the shared shell with the same primary navigation and header

#### Scenario: Primary navigation moves between areas

- **WHEN** the user selects an area from the shell navigation
- **THEN** the app navigates to that area and marks it as the current location

#### Scenario: Desktop navigation is horizontal

- **WHEN** the app is viewed at a desktop width
- **THEN** the primary navigation is presented as a horizontal top bar with the areas Dashboard, Trips, Bag Library, Items Library and Shared Links, along with global search, a create action and the account control

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

### Requirement: Visual system is consistent across app and landing

The app and the landing page SHALL use the Stitch design systems' token base and component appearance, so interactive controls look consistent throughout, in both light and dark themes.

#### Scenario: Shared controls use the reference appearance

- **WHEN** the user interacts with controls such as buttons, inputs, cards and dialogs
- **THEN** they match the Stitch design system's appearance and token base

### Requirement: Paid template source is not committed

The repository SHALL NOT contain third-party template or design-tool source; only application code derived from it, or written for Pack Mate, SHALL be committed.

#### Scenario: Template source stays out of the repository

- **WHEN** the repository contents and build output are inspected
- **THEN** no third-party template source is present and only derived application code is present

## ADDED Requirements

### Requirement: The visual system provides light and dark themes

The application SHALL define both a light theme and a dark theme drawn from the Stitch design systems, and SHALL apply the user's chosen theme across the shell, the content surfaces, the auth pages and the landing page.

#### Scenario: Light theme

- **WHEN** the light theme is active
- **THEN** the app uses the light palette, typography and elevation

#### Scenario: Dark theme

- **WHEN** the dark theme is active
- **THEN** the app uses the dark palette, typography and elevation, and numeric values use the monospace numeric face

### Requirement: The signed-in app presents a read-only summary home

The signed-in app SHALL present a summary home that composes existing trip data read-only — active trips, the next journey, packing progress and weight against bag limits, and upcoming trips — without introducing new data, writes or domain concepts.

#### Scenario: A user opens the summary home

- **WHEN** a signed-in user opens the summary home
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
