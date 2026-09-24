# Pack Mate

[![Pipeline](https://github.com/649000/pack-mate-web/actions/workflows/pipeline.yml/badge.svg)](https://github.com/649000/pack-mate-web/actions/workflows/pipeline.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/products/auth)
[![Unit tests](https://img.shields.io/badge/unit-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![E2E tests](https://img.shields.io/badge/e2e-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)

Pack Mate is a consumer packing-list application. It answers a single question: what am I bringing on this trip?

The product has one mental model: a trip owns a packing list, and a packing list is made of items. Items may optionally belong to a bag, or be marked **With Me** for the things you carry directly, like a passport or a phone. Bags are optional. A user can create, pack and share a list without ever configuring a container.

The application is mobile-first, fast to interact with, and deliberately small. It is a checklist, not an inventory-management system.

## Features

**Trips and packing lists**

- Create a trip with a name, country, and optional destination and dates.
- Add reusable items and bags from a personal library, or create trip-only entries.
- Mark items as packed, or as **With Me** rather than in a bag.
- Track packing progress across the list and per bag.
- Duplicate a trip to reuse an existing plan.
- Bulk pack, unpack and clear actions for fast updates on a phone.

**Libraries**

- A reusable item library with quantities, descriptions, links, images, categories and weights.
- A reusable bag library, where each bag can define default contents and a weight limit.
- Adding a library bag to a trip copies the bag and its default contents, so later edits to the library never change an existing trip.
- Fast library selection with type-ahead filtering and a global search dialog grouped by trips, items and bags.

**Travel context**

- Destination facts for each country: currency, calling code, plug types, voltage, frequency and time zones.
- Packing suggestions derived from the destination, the trip dates, the current list and the library. Dismissed suggestions are remembered per trip.

**Sharing and export**

- Public, read-only share links for a trip, with a single active link per trip and revocable at any time.
- Printable PDF export of a packing list, as a blank sheet or with packed items ticked.

**Account and presentation**

- A single account surface for profile details (display name, birthday, gender) and security.
- Light and dark themes that follow the design system, with icons and flags used to identify records at a glance.

## Architecture

Pack Mate is a statically exported Next.js application. There is no custom backend for the MVP.

- **Identity** is handled by Firebase Authentication. Firebase issues the identity token.
- **Data** lives in Supabase Postgres, accessed directly from the browser through PostgREST. Authorisation is enforced by Row Level Security, not by the client.
- **The bridge** between the two is a Firebase Auth blocking function (`functions/index.js`). Supabase assigns the Postgres role from the JWT `role` claim, which Firebase tokens do not carry, so the function stamps `role: authenticated` on every sign-up and sign-in. Without it every request would run as `anon`.

Because the app is static, the frontend carries no server secrets. The public Firebase API key and the Supabase publishable key are identifiers gated by RLS, and are configured through `NEXT_PUBLIC_*` values validated at load in `lib/public-config.ts`. The build is checked to prove no server-side secret leaks into the output.

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4, shadcn/ui and Radix primitives |
| Auth | Firebase Authentication |
| Data | Supabase Postgres (PostgREST + RLS) |
| Hosting | Firebase Hosting, Firebase Functions |
| Unit tests | Vitest and Testing Library |
| End-to-end | Playwright |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 24 and npm.
- Docker, for the local Supabase stack used by integration tests.
- The Supabase CLI, installed as a dev dependency and run through `npx`.
- The Firebase CLI is not required for local development. Deployment runs in CI.

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server uses the committed production defaults for Firebase and Supabase, so no environment file is required to start.

To point the app at the local Supabase stack instead, start it and use the values from `.env.test`:

```bash
npm run supabase:start
npm run supabase:reset
```

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH \
npm run dev
```

The local stack cannot verify third-party Firebase tokens, so signed-in flows still use the shared identity project.

### Build

The production build is a static export written to `out/`:

```bash
npm run build
```

## Configuration

Public client configuration is environment-driven and validated at startup. When a value is unset, the committed default in `lib/public-config.ts` is used, so a normal production build needs no environment file.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key (identifier, not a secret) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app id |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, gated by RLS |

See `.env.example` for the full list with comments. No server-side secret belongs in any of these values.

## Testing

Tests are split by the environment they need, and all of them run in CI.

| Command | Scope |
| --- | --- |
| `npm test` | Unit tests for domain logic, validation and components |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage, enforced at a ratcheting threshold |
| `npm run test:integration` | Data access against the local Supabase stack, including RLS |
| `npm run test:smoke` | Production smoke test of the Firebase-to-Supabase bridge |
| `npm run test:e2e` | Playwright tests against the production static build |

Integration tests require the local stack and a schema built from migrations:

```bash
npm run supabase:start
npm run supabase:reset
npm run test:integration
```

The integration suite proves that a second user can never read or write another user's rows.

The smoke test is the only test that touches production. It runs after deploy, verifies the identity bridge, and cleans up after itself.

End-to-end tests run against the built output. The public and authentication-gating tests are unauthenticated and write no production data. The authenticated critical path is gated behind `E2E_AUTH=1` and runs against the deployed backend in CI.

Run the full local verification:

```bash
npm run verify       # typecheck, lint, format check, unit tests, build, bundle check
npm run verify:all   # verify, then end-to-end tests
```

## Database

Schema changes are versioned SQL migrations in `supabase/migrations/`. Migrations are applied to production by CI behind the protected `production` environment, before the application is deployed. Never edit an applied migration; add a new one.

```bash
npm run supabase:start   # start the local stack
npm run supabase:reset   # rebuild the local schema from migrations
npm run supabase:stop    # stop the local stack
```

Every table is protected by Row Level Security. Ownership is derived from the authenticated user's token and never trusted from the client, so a request cannot reach another user's rows by changing an id.

## Deployment

Deployment is fully automated by GitHub Actions in `.github/workflows/pipeline.yml`. Developers do not deploy from a local machine.

1. On every pull request and on `main`, the pipeline runs type-check, lint and formatting, unit tests with coverage, integration tests against an ephemeral Supabase stack, the build, the bundle secret check, secret scanning, dependency review and end-to-end tests.
2. On `main`, the pipeline detects migration changes and applies them to production behind the protected environment.
3. Firebase Hosting and Firebase Functions are deployed from the build artifact.
4. A production smoke test verifies the Firebase-to-Supabase identity bridge and cleans up after itself, followed by the authenticated end-to-end flow.

No deployment tooling is run manually, and no credentials live in the repository. Client configuration is environment-driven; genuine secrets are held in GitHub Actions secrets.

## Project Structure

```
app/                    Next.js App Router routes and pages
  (app)/                Authenticated area: dashboard, trips, bags, items, shares, account
  share/                Public read-only shared trip view
  sign-in/              Authentication
components/             React components, including the app shell, landing page and UI primitives
lib/                    Domain logic: data access, validation, types, config, PDF and helpers
supabase/migrations/    Versioned SQL schema and RLS policies
functions/              Firebase Auth blocking function that stamps the authenticated role
e2e/                    Playwright tests
tests/                  Integration and smoke tests
openspec/               Specifications that describe the intended behaviour
scripts/                Build and tooling scripts, including the bundle secret check
```

## Domain Model

- A **user** owns their trips, libraries and share links.
- A **trip** is a journey or travel occasion and owns a packing list.
- A **packing list** is what the user brings, made of trip-scoped copies of items and optional bags.
- A **library** holds reusable items and bags that can be added to any trip. Adding a library record to a trip copies it; later edits to the library do not change existing trips.
- An **item** may belong to a bag, be marked **With Me**, or have no assignment yet. Bag membership and With Me are mutually exclusive.
- A **bag** is a physical container. A library bag may define default contents and a weight limit.

Packed state and quantity belong to the trip, not the library.

## Security

- Authentication is delegated to Firebase Authentication. No password handling, session management or token verification is implemented from scratch.
- Authorisation is enforced by Supabase Row Level Security. The frontend is never the enforcement point.
- Client-provided ownership information is never trusted.
- Input is validated at the boundary with explicit schemas.
- Public client values are identifiers, not secrets. The build is scanned to prove that no server-side secret reaches the output.

## Specifications

Non-trivial work is described in OpenSpec before it is implemented. The archived specifications under `openspec/` are the source of truth for behaviour. Changes are proposed, implemented and verified against those artifacts.
