## ADDED Requirements

### Requirement: The chosen theme persists for the user

The system SHALL persist a signed-in user's light or dark theme choice on their account and SHALL apply it when they use the app, so the choice follows them across desktop and mobile rather than living only on one device.

#### Scenario: Choose a theme

- **WHEN** a signed-in user switches between light and dark
- **THEN** the choice is stored on their account and applied

#### Scenario: Theme follows the user to another device

- **WHEN** a signed-in user opens the app on another device
- **THEN** their stored theme is applied

#### Scenario: Default theme

- **WHEN** a user has never chosen a theme
- **THEN** the app uses the default light theme

#### Scenario: An invalid theme is rejected

- **WHEN** a theme other than light or dark is written to a profile
- **THEN** the system rejects the write
