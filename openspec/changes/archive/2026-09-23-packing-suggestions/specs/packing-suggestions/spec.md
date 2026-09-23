## Purpose

Proposes items a trip might be missing, derived from the destination, dates, current list and library, and remembers which suggestions the user has dismissed.

## ADDED Requirements

### Requirement: Trip suggestions are derived from the trip's data

The system SHALL propose items a trip may be missing, derived only from data it already holds — the destination's facts, the trip's dates, the trip's entries and the user's library — and SHALL NOT require the user to configure anything.

#### Scenario: A trip shows suggestions

- **WHEN** a user opens a trip
- **THEN** the system shows suggestions relevant to that trip, each with a short reason

#### Scenario: Nothing is suggested twice

- **WHEN** a suggested item already exists on the trip
- **THEN** it is not suggested again

#### Scenario: A suggestion can reuse a library item

- **WHEN** a suggested item exists in the user's library
- **THEN** adding the suggestion uses that library item

#### Scenario: No suggestions when nothing is missing

- **WHEN** the trip already covers everything the rules look for
- **THEN** no suggestions are shown

### Requirement: Suggestions include a missing plug adapter

The system SHALL suggest a travel adapter when the destination requires plug types the trip does not already account for.

#### Scenario: Destination needs an adapter that is not on the list

- **WHEN** the destination has known plug types and the trip has no adapter-like entry
- **THEN** the system suggests a travel adapter for those plug types

### Requirement: Suggestions include missing essentials

The system SHALL suggest core essentials and category basics that a trip of its length is missing, such as clothing on a multi-day trip and core items to carry "With Me".

#### Scenario: Multi-day trip has no clothing

- **WHEN** a trip spans several days and has no clothing entries
- **THEN** the system suggests clothing

#### Scenario: Trip has no items carried "With Me"

- **WHEN** a trip has no items marked "With Me" and none of the core essentials in its list
- **THEN** the system suggests a core essential

### Requirement: A user can add or dismiss a suggestion

The system SHALL let a user add a suggested item to the trip (from the library when a match exists, otherwise as a new item) or dismiss the suggestion. A dismissed suggestion SHALL remain dismissed for that trip and SHALL NOT be shown again.

#### Scenario: Add a suggestion

- **WHEN** a user adds a suggestion
- **THEN** the item is added to the trip and the suggestion is no longer shown

#### Scenario: Dismiss a suggestion

- **WHEN** a user dismisses a suggestion
- **THEN** the suggestion is no longer shown for that trip, including after reloading

#### Scenario: Dismissals belong to the user

- **WHEN** another user views a trip they own
- **THEN** they do not see the first user's dismissals, and they cannot read or modify them

### Requirement: The suggestion engine is provider-based and AI-ready

The system SHALL produce suggestions through a provider interface, so the built-in rules are the always-on baseline and an additional provider can be added later without changing the interface. The system SHALL fall back to the rules when an additional provider is disabled or fails.

#### Scenario: A provider fails

- **WHEN** an additional suggestion provider fails or times out
- **THEN** the rules-based suggestions are still returned and no error is shown to the user

#### Scenario: Rules are always the baseline

- **WHEN** an additional provider returns suggestions
- **THEN** the rules-based suggestions remain available and are not removed
