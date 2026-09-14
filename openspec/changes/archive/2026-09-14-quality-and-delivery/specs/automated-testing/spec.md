## Purpose

Verifies behaviour automatically so regressions are caught before release: domain logic, UI flows, data-access security (RLS), and the absence of secrets in the built output.

## ADDED Requirements

### Requirement: Unit tests cover domain logic and validation
The project SHALL have unit tests for pure domain logic and input validation, runnable without network access.

#### Scenario: Validation rules are tested
- **WHEN** unit tests run
- **THEN** blank names, non-positive or non-integer quantities, and invalid date ranges are rejected

#### Scenario: Packing logic is tested
- **WHEN** unit tests run
- **THEN** packing progress and entry grouping (bag, With Me, loose) are covered, including empty input

### Requirement: End-to-end tests cover the UI
The project SHALL have browser tests covering the public pages, authentication gating, responsive layout and error states.

#### Scenario: Public and gated routes
- **WHEN** end-to-end tests run
- **THEN** the landing and sign-in pages render, and an app route redirects to sign-in when unauthenticated

#### Scenario: Responsive layout
- **WHEN** end-to-end tests run at mobile and desktop widths
- **THEN** the public pages have no horizontal overflow

#### Scenario: Error state
- **WHEN** an unknown route is requested
- **THEN** a not-found response is returned

### Requirement: Integration tests verify data access and RLS
The project SHALL have integration tests that run against a live Supabase project and prove that one user cannot read or write another user's rows, and that copy-on-add isolates library edits from existing trips.

#### Scenario: Cross-user access is denied
- **WHEN** a second authenticated user reads or updates the first user's rows
- **THEN** no rows are returned and no rows are changed

#### Scenario: Forged ownership is rejected
- **WHEN** a user attempts to insert a row owned by another user
- **THEN** the write is rejected

#### Scenario: Library edits do not change trips
- **WHEN** a library item that was copied into a trip is edited or deleted
- **THEN** the trip's entries are unchanged

### Requirement: The build output is checked for secrets
The project SHALL scan the built output and fail if secret material is present.

#### Scenario: No secrets in the bundle
- **WHEN** the bundle check runs after a build
- **THEN** it fails if forbidden secret patterns are found and passes otherwise

### Requirement: Tests gate deployment
Tests SHALL run in CI on every pull request and must pass before deployment.

#### Scenario: CI blocks on failure
- **WHEN** lint, type-check, unit, build, bundle check or end-to-end tests fail
- **THEN** CI fails and the change is not deployed
