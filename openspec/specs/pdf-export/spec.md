# pdf-export Specification

## Purpose
Lets a trip owner download a printable, pen-tick packing-list PDF so the list can be used offline while packing, either as a blank sheet or with items already marked packed ticked off.

## Requirements

### Requirement: Export a trip's packing list as a printable PDF

The system SHALL let the owner of a trip download a printable PDF of that trip's packing list. The PDF SHALL contain real text rather than a rasterised image of the page, and SHALL render each item with a checkbox intended to be ticked with a pen. The system MUST offer this only for a trip the user owns.

#### Scenario: Owner downloads a PDF

- **WHEN** an authenticated user exports a trip they own
- **THEN** the system downloads a PDF file for that trip

#### Scenario: Text, not an image

- **WHEN** the downloaded PDF is opened
- **THEN** its text can be selected and searched

#### Scenario: Not offered for a trip the user does not own

- **WHEN** a user is not the owner of a trip
- **THEN** the system does not offer or produce an export for that trip

### Requirement: Choose whether packed items are ticked

The system SHALL let the owner choose between a blank sheet and matching the trip's packed state. A blank sheet SHALL be the default. In match mode, an entry marked packed SHALL show its checkbox ticked and an unpacked entry SHALL show an empty checkbox. In blank mode every checkbox SHALL be empty regardless of packed state.

#### Scenario: Blank is the default

- **WHEN** the owner opens the export options without choosing a mode
- **THEN** the blank sheet is selected

#### Scenario: Match packed state

- **WHEN** the owner exports in match mode for a trip with some entries marked packed
- **THEN** those entries' checkboxes are ticked and the remaining entries' checkboxes are empty

#### Scenario: Blank ignores packed state

- **WHEN** the owner exports a blank sheet for a trip with entries marked packed
- **THEN** every checkbox in the PDF is empty

### Requirement: PDF shows the trip and its bags

The PDF SHALL show the trip name, the trip's start and end dates when set, and the trip's bags in their nesting order. Bags nested inside another bag SHALL be shown as nested in the PDF.

#### Scenario: Trip details

- **WHEN** a trip has a name and dates
- **THEN** the PDF shows the name and dates

#### Scenario: Nested bags

- **WHEN** a trip has a bag nested inside another bag
- **THEN** the PDF shows that nesting

#### Scenario: Dates absent

- **WHEN** a trip has no dates set
- **THEN** the PDF omits the dates without leaving an empty gap

### Requirement: PDF shows each entry's details

For each entry the PDF SHALL show the entry's name, its quantity when greater than one, and its category when set. Entries SHALL be grouped under the bag they belong to, or under a With Me group, or under an unassigned group, matching where they sit in the app.

#### Scenario: Entry details

- **WHEN** a trip has an entry with a quantity greater than one and a category
- **THEN** the PDF shows the name, the quantity and the category

#### Scenario: Grouping

- **WHEN** a trip has entries inside a bag, entries marked With Me and unassigned entries
- **THEN** the PDF groups them under their bag, a With Me group and an unassigned group respectively

### Requirement: PDF shows per-bag weight against its limit

For each bag the PDF SHALL show the bag's total weight and, when the bag has a weight limit, that limit. The PDF SHALL make clear when a bag's weight exceeds its limit.

#### Scenario: Weight and limit

- **WHEN** a trip has a bag with a weight limit and a known total weight
- **THEN** the PDF shows the weight against the limit

#### Scenario: Over the limit

- **WHEN** a bag's weight exceeds its limit
- **THEN** the PDF indicates the bag is over its limit

#### Scenario: No limit set

- **WHEN** a bag has no weight limit
- **THEN** the PDF shows its weight without a limit

### Requirement: PDF omits images, links and descriptions

The PDF MUST NOT include entry images, entry links or entry descriptions. It SHALL remain a focused ticking sheet.

#### Scenario: Entry with an image, link and description

- **WHEN** an entry has an image URL, a link and a description
- **THEN** none of them appear in the PDF

### Requirement: Empty packing list produces a valid PDF

The system SHALL produce a valid PDF for a trip with no entries and no bags, showing an empty state rather than failing or producing a broken file.

#### Scenario: Empty trip

- **WHEN** the owner exports a trip with no bags and no entries
- **THEN** the system downloads a valid PDF showing an empty state

### Requirement: PDF filename identifies the trip

The downloaded file SHALL be named so it identifies the trip and ends in `.pdf`.

#### Scenario: Filename

- **WHEN** the owner exports a trip named "Iceland 2026"
- **THEN** the downloaded filename contains the trip name and ends in `.pdf`
