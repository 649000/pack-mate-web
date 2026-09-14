# delivery Specification

## Purpose
Builds, verifies and deploys the application through GitHub Actions so releases are repeatable and no developer machine deploys production.

## Requirements

### Requirement: Continuous integration on every change
The project SHALL run continuous integration on pull requests and on the main branch.

#### Scenario: CI checks run
- **WHEN** a pull request is opened or main is updated
- **THEN** lint, type-check, unit tests, build, the bundle check and end-to-end tests run

### Requirement: Continuous deployment from main
The project SHALL deploy to Firebase Hosting and Firebase Functions from the main branch via GitHub Actions, and SHALL verify the live backend after deploying.

#### Scenario: Deploy runs on main
- **WHEN** a commit is pushed to main
- **THEN** the app is built, hosting and functions are deployed, and the integration tests run against the deployed backend

### Requirement: No manual production deploys
Production deployment MUST NOT be performed manually from a developer machine.

#### Scenario: Deploy path
- **WHEN** production needs updating
- **THEN** it is updated by the deploy workflow, not by a local `firebase deploy`

### Requirement: Secrets are confined to CI
The repository MUST NOT contain secrets. Public client configuration SHALL be committed; genuine secrets SHALL be provided to CI as encrypted secrets.

#### Scenario: Public config is committed
- **WHEN** the app is built without any local environment file
- **THEN** it builds successfully using committed public configuration

#### Scenario: Deploy credentials
- **WHEN** the deploy workflow runs
- **THEN** it authenticates with a service account provided as an encrypted CI secret
