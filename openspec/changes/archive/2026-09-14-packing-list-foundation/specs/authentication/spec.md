## Purpose

Lets a user sign in and out, and ensures every trip, bag, item, and packing list is scoped to the authenticated user.

## ADDED Requirements

### Requirement: User can sign in
The system SHALL authenticate users through Firebase Authentication before granting access to application data.

#### Scenario: Successful sign in
- **WHEN** a user provides valid credentials through the sign-in flow
- **THEN** the system establishes an authenticated session and the user can access their own data

#### Scenario: Unauthenticated access is blocked
- **WHEN** a user without an authenticated session requests application data
- **THEN** the system denies access and returns no user data

### Requirement: User can sign out
The system SHALL allow an authenticated user to end their session.

#### Scenario: Sign out
- **WHEN** an authenticated user signs out
- **THEN** the session ends and subsequent data requests are denied

### Requirement: Data is scoped to the authenticated user
The system MUST scope every read and write of user-owned data to the authenticated user, and MUST NOT allow a user to access another user's resources.

#### Scenario: Cross-user access is denied
- **WHEN** an authenticated user attempts to read or modify a resource owned by another user
- **THEN** the system denies the operation and returns no data for that resource

#### Scenario: Owned data is accessible
- **WHEN** an authenticated user reads their own trips, bags, items, or packing lists
- **THEN** the system returns those resources

### Requirement: Authenticated requests carry the authenticated role
The system MUST ensure every signed-in user's token carries the `authenticated` role, so database authorization (RLS) applies. Requests without a valid session MUST NOT be treated as authenticated.

#### Scenario: Signed-in user is authorized
- **WHEN** a signed-in user makes a data request
- **THEN** the request is evaluated as the authenticated role and owner policies apply

#### Scenario: Unauthenticated request is not authorized
- **WHEN** a request is made without a valid session
- **THEN** it is not treated as authenticated and cannot read or write user data
