# authentication Specification

## Purpose
Lets a user sign in and out, and ensures every trip, bag, item, and packing list is scoped to the authenticated user.

## Requirements

### Requirement: User can sign in
The system SHALL authenticate users through Firebase Authentication before granting access to application data. When a user has enrolled a second factor, the system MUST require that second factor to be completed before establishing the session.

#### Scenario: Successful sign in
- **WHEN** a user provides valid credentials through the sign-in flow
- **THEN** the system establishes an authenticated session and the user can access their own data

#### Scenario: Successful sign in with a second factor
- **WHEN** a user who has enrolled a second factor provides valid first-factor credentials
- **THEN** the system requires a valid second-factor code and only establishes the session after it is accepted

#### Scenario: Second factor not completed
- **WHEN** a user who has enrolled a second factor fails to provide a valid second-factor code
- **THEN** the system does not establish an authenticated session

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

### Requirement: User can verify their email
The system SHALL send a verification message when a user creates an email and password account, SHALL show whether the user's email is verified, and SHALL let an unverified user request another verification message. Unverified users SHALL retain access to the application.

#### Scenario: Verification message on sign-up
- **WHEN** a user creates an account with an email and password
- **THEN** the system sends a verification message to that address

#### Scenario: Verification status shown
- **WHEN** a user views their account
- **THEN** the system shows whether their email is verified

#### Scenario: Resend a verification message
- **WHEN** an unverified user requests another verification message
- **THEN** the system sends a new message to their email

#### Scenario: Unverified users keep access
- **WHEN** a user has not verified their email
- **THEN** the system still lets them sign in and use the application

### Requirement: User can reset their password
The system SHALL let a user request a password reset from the sign-in flow, and MUST NOT reveal whether an email address has an account.

#### Scenario: Request a password reset
- **WHEN** a user submits their email address on the password reset page
- **THEN** the system sends a password reset message to that address and confirms the request was received

#### Scenario: Invalid email rejected
- **WHEN** a user submits a value that is not a valid email address
- **THEN** the system rejects the request and shows an error

#### Scenario: Address is not disclosed
- **WHEN** a user requests a reset for an address that has no account
- **THEN** the system responds the same way as for a known address

### Requirement: Sign-in collision is resolved by linking
When a user signs in with a provider whose email already belongs to an account with a different sign-in method, the system SHALL NOT fail with an unexplained error. It SHALL identify the existing method, let the user authenticate with it, and link the provider to the existing account so the user ends up signed in with the provider linked.

#### Scenario: Google sign-in collides with an existing password account
- **WHEN** a user signs in with Google using an email that already has a password account
- **THEN** the system asks for that account's password, signs the user in, links Google, and the user ends up signed in with Google linked

#### Scenario: Existing-account password is wrong
- **WHEN** the user fails to authenticate with the existing account's method
- **THEN** the system does not link the provider and shows an error

#### Scenario: Provider already linked elsewhere
- **WHEN** the provider credential is already linked to a different account
- **THEN** the system does not link it and explains the conflict

### Requirement: Passwords meet a minimum length
The system SHALL require passwords to be at least 8 characters when an account is created or a password is set or changed. The requirement MUST be enforced by the authentication service, not only in the client.

#### Scenario: Short password rejected
- **WHEN** a user submits a password shorter than 8 characters when creating an account or changing a password
- **THEN** the system rejects it and shows the requirement

#### Scenario: Compliant password accepted
- **WHEN** a user submits a password of at least 8 characters
- **THEN** the system accepts it

#### Scenario: Existing shorter passwords still sign in
- **WHEN** an account created before the requirement signs in with its existing shorter password
- **THEN** the system still signs the user in
