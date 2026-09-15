## MODIFIED Requirements

### Requirement: Continuous integration on every change
The project SHALL run continuous integration on the main branch and SHALL run the same checks on pull requests. Continuous integration SHALL include type-check, lint, formatting, unit tests with coverage, integration tests, the build, the bundle check, dependency and secret scanning, and end-to-end tests.

#### Scenario: CI checks run
- **WHEN** the main branch is updated or a pull request is opened
- **THEN** type-check, lint, formatting, unit tests with coverage, integration tests, build, bundle check, dependency and secret scanning, and end-to-end tests run

#### Scenario: Checks are required
- **WHEN** any required check fails
- **THEN** the pipeline fails and the change is not deployed

### Requirement: Continuous deployment from main
The project SHALL apply database migrations, then deploy to Firebase Hosting and Firebase Functions from the main branch via GitHub Actions, and SHALL verify the deployed backend with a smoke check after deploying.

#### Scenario: Deploy runs on main
- **WHEN** a commit is pushed to the main branch and all required checks pass
- **THEN** any new migrations are applied, hosting and functions are deployed, and a production smoke check runs against the deployed backend

#### Scenario: Migrations precede the application deploy
- **WHEN** a commit changes the database schema
- **THEN** the migrations are applied before the application is deployed

#### Scenario: No migration changes
- **WHEN** a commit does not change the database schema
- **THEN** no migration step runs

### Requirement: Secrets are confined to CI
The repository MUST NOT contain secrets. Public client configuration SHALL be environment-driven, with non-secret public values committed or supplied to CI as variables, and genuine secrets SHALL be provided to CI as encrypted secrets.

#### Scenario: Public config is committed
- **WHEN** the app is built for a given environment without local secret files
- **THEN** it uses committed, non-secret public configuration for that environment and fails fast if a required public value is missing

#### Scenario: Deploy credentials
- **WHEN** the deploy workflow runs
- **THEN** it authenticates with a service account provided as an encrypted CI secret

## ADDED Requirements

### Requirement: Database migrations are applied by CI
Database migrations SHALL be versioned in the repository and applied to production by the pipeline, gated behind a protected environment, rather than applied manually.

#### Scenario: Protected migration step
- **WHEN** the pipeline applies migrations to production
- **THEN** the step requires the protected environment's approval

#### Scenario: Migrations are tested before applying
- **WHEN** integration tests run
- **THEN** the schema is rebuilt from the committed migrations
