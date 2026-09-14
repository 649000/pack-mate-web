## 1. Unit testing

- [x] 1.1 Add Vitest and a config that excludes the reference templates, functions and generated output; verify `npm test` runs
- [x] 1.2 Extract pure packing logic (progress, grouping, location encoding) into a testable module; verify the app still builds
- [x] 1.3 Unit-test validation and packing logic including edge cases; verify all unit tests pass

## 2. UI testing

- [x] 2.1 Add Playwright with a config that starts the app and runs Chromium; verify `npm run test:e2e` runs
- [x] 2.2 Test the public landing page, auth gating, sign-in form, responsive layout and the not-found state; verify all UI tests pass

## 3. Integration testing

- [x] 3.1 Add an integration test that creates two users and proves cross-user read/write denial, forged-owner rejection and copy-on-add isolation; verify it runs against the live project once the role claim is deployed
- [x] 3.2 Keep integration tests out of the default unit run via a separate config and script

## 4. Build checks

- [x] 4.1 Add a bundle check that fails when secret patterns appear in the built output; verify it passes on a clean build

## 5. Component tests

- [x] 5.1 Add React Testing Library with a jsdom environment and test setup (jest-dom, browser polyfills); verify component tests run
- [x] 5.2 Test items, bags, trips and sign-in behaviour — empty states, create flows, blank-name rejection and mode toggle; verify all component tests pass

## 6. Formatting and static analysis

- [x] 6.1 Add Prettier with a config and ignore file, format the codebase; verify `prettier --check` passes
- [x] 6.2 Add `eslint-plugin-security` to the ESLint config; verify lint passes

## 7. Continuous integration

- [x] 7.1 Add a pipeline running as separate jobs (typecheck, lint+format, unit+component, build+bundle, e2e) on push to main; verify the workflow file is valid
- [ ] 7.2 Verify the pipeline passes on GitHub (requires pushing to the repository)

## 8. Continuous deployment

- [x] 8.1 Gate deployment on all checks and deploy Hosting + Functions, then run the integration tests; verify the workflow file is valid
- [ ] 8.2 Configure the `FIREBASE_SERVICE_ACCOUNT` CI secret; verify a main deploy succeeds and the integration tests pass

## 9. Authenticated end-to-end

- [x] 9.1 Add a gated authenticated Playwright flow (sign up, create a trip, pack an item, delete the trip); verify it is skipped unless `E2E_AUTH=1`
- [ ] 9.2 Verify the authenticated flow passes against the deployed backend

## 10. Configuration hygiene

- [x] 10.1 Commit public client config and remove local env files; verify the app builds with no env files present
- [x] 10.2 Update `.gitignore` so nested `node_modules` (functions) and env files are ignored while config is tracked
