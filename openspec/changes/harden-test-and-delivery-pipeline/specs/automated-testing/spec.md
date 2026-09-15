## MODIFIED Requirements

### Requirement: End-to-end tests cover the UI
The project SHALL have browser tests covering the public pages, authentication gating, responsive layout, error states, and the authenticated critical path (sign up, create a trip, pack an item, delete a trip). Tests SHALL run against the production static build, not the development server.

#### Scenario: Public and gated routes
- **WHEN** end-to-end tests run
- **THEN** the landing and sign-in pages render, and an app route redirects to sign-in when unauthenticated

#### Scenario: Responsive layout
- **WHEN** end-to-end tests run at mobile and desktop widths
- **THEN** the public pages have no horizontal overflow

#### Scenario: Error state
- **WHEN** an unknown route is requested
- **THEN** a not-found response is returned

#### Scenario: Authenticated critical path
- **WHEN** the authenticated end-to-end flow runs
- **THEN** it signs up a user against the non-production identity provider, creates and packs a trip, and deletes it, using the non-production data backend

#### Scenario: Production build
- **WHEN** end-to-end tests run
- **THEN** they exercise the built static output served over HTTP, not the development server

### Requirement: Integration tests verify data access and RLS
The project SHALL have integration tests that run against an ephemeral local Supabase stack rebuilt from the project's migrations, authenticated with identity tokens from a dedicated non-production identity provider. They SHALL prove that one user cannot read or write another user's rows, that forged ownership is rejected, and that copy-on-add isolates library edits from existing trips.

#### Scenario: Cross-user access is denied
- **WHEN** a second authenticated user reads or updates the first user's rows
- **THEN** no rows are returned and no rows are changed

#### Scenario: Forged ownership is rejected
- **WHEN** a user attempts to insert a row owned by another user
- **THEN** the write is rejected

#### Scenario: Library edits do not change trips
- **WHEN** a library item that was copied into a trip is edited or deleted
- **THEN** the trip's entries are unchanged

#### Scenario: Migrations rebuild the schema
- **WHEN** the local stack is rebuilt from migrations
- **THEN** every table and row-level security policy required by the tests exists

#### Scenario: Identity token bridge
- **WHEN** an integration test authenticates with a non-production identity token
- **THEN** the data backend accepts the token and the request runs as an authenticated user

### Requirement: Tests gate deployment
Tests SHALL run in CI on every change to the main branch, and on pull requests when the project adopts them, and MUST pass before deployment.

#### Scenario: CI blocks on failure
- **WHEN** type-check, lint, formatting, unit, integration, build, bundle check, coverage or end-to-end tests fail
- **THEN** CI fails and the change is not deployed

#### Scenario: Verification precedes deployment
- **WHEN** a change is pushed to the main branch
- **THEN** integration and end-to-end tests complete before the application is deployed

## ADDED Requirements

### Requirement: Test environments are isolated from production
Automated tests MUST NOT read from or write to production resources. Only a single post-deploy smoke check MAY exercise the production backend, and it MUST clean up any data it creates.

#### Scenario: No production access during tests
- **WHEN** unit, integration or end-to-end tests run
- **THEN** they use only local or dedicated non-production resources

#### Scenario: Post-deploy smoke cleans up
- **WHEN** the post-deploy smoke check runs against production
- **THEN** it removes any user or data it created

### Requirement: Coverage threshold is enforced
The project SHALL measure unit-test coverage and SHALL fail CI when coverage falls below the configured threshold.

#### Scenario: Coverage below threshold
- **WHEN** coverage of the measured scope is below the configured threshold
- **THEN** CI fails

### Requirement: Dependency and vulnerability scanning gate changes
The project SHALL scan dependencies for known vulnerabilities and SHALL fail CI when a high-severity vulnerability is present, and SHALL scan for committed secrets.

#### Scenario: High-severity vulnerability
- **WHEN** a dependency with a known high-severity vulnerability is present
- **THEN** CI fails

#### Scenario: Secret scanning
- **WHEN** a commit contains secret material
- **THEN** the scan fails
