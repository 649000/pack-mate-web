## ADDED Requirements

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

## MODIFIED Requirements

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
