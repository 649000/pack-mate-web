## Purpose

Defines the application's visual system: the shell and page chrome used throughout the authenticated app, and the public marketing landing page, both derived from the licensed Metronic reference.

## ADDED Requirements

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
