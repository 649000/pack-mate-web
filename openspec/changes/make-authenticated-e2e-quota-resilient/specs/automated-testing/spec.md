## MODIFIED Requirements

### Requirement: Test environments are isolated from production
Unit and integration tests MUST NOT read from or write to production resources. Checks that exercise the deployed backend MUST use disposable identities and MUST remove the application data they create; the post-deploy smoke MUST also delete the identity it creates. The authenticated end-to-end flow signs up a disposable identity per test, so it is subject to the identity provider's per-IP account-creation quota and SHALL run sparingly: once per deploy from a fresh runner, not repeatedly from one IP.

#### Scenario: Hermetic tests
- **WHEN** unit or integration tests run
- **THEN** they use only local resources

#### Scenario: Live checks use disposable identities
- **WHEN** the authenticated end-to-end flow runs against the deployed backend
- **THEN** it uses a unique address and removes the application data it creates

#### Scenario: Post-deploy smoke cleans up
- **WHEN** the post-deploy smoke runs against production
- **THEN** it deletes the user and data it created

#### Scenario: Live sign-up throttling is reported
- **WHEN** the authenticated end-to-end flow is throttled by the identity provider's per-IP account-creation quota during sign-up
- **THEN** it fails with a message naming the quota rather than a generic navigation timeout
