## ADDED Requirements

### Requirement: User can link a social sign-in provider
The system SHALL let an authenticated user link Google to their account, and SHALL require re-authentication before linking.

#### Scenario: Link Google
- **WHEN** an authenticated user re-authenticates and links Google
- **THEN** the system adds the Google credential and the user can sign in with Google

#### Scenario: Google already linked
- **WHEN** a user attempts to link Google to an account that already has it linked
- **THEN** the system reports that Google is already linked

#### Scenario: Google credential belongs to another account
- **WHEN** the Google account the user chooses is already linked to a different account
- **THEN** the system does not link it and explains the conflict
