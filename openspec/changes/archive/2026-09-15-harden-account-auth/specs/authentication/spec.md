## ADDED Requirements

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
