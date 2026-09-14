# AGENTS.md

## Project Overview

Pack Mate is a B2C packing-list application.

The core concept is:

* Users create packing lists for trips.
* A packing list contains items.
* Items can optionally be assigned to a bag.
* Bags represent physical containers such as backpacks, suitcases, daypacks, etc.
* Some items are carried directly by the user rather than placed in a bag. Use **"With Me"** for this concept.
* Bags and their assigned items form part of the overall packing list.
* Users do not need to create bags. Items can exist directly in the packing list or be marked **With Me**.
* There is no organisation, workspace, or multi-tenant model.

The product should remain simple and consumer-focused. Do not introduce enterprise concepts unless explicitly requested.

## Product Principles

1. **Simple by default**

    * A user should be able to create and use a packing list without configuring bags.
    * Avoid unnecessary setup and configuration.

2. **Fast interaction**

    * Packing should feel like a lightweight checklist, not an inventory-management system.
    * Minimise unnecessary forms, clicks and navigation.

3. **Mobile-first**

    * Packing lists will frequently be used on phones while travelling.
    * Interfaces must work well on small screens before optimising for desktop.

4. **Clear mental model**

    * Trip → Packing List → Items
    * Optional: Items → Bag
    * Optional: Items → With Me

5. **Do not over-engineer**

    * Prefer the simplest implementation that satisfies the requirement.
    * Do not introduce abstractions, services, libraries or infrastructure without a clear benefit.

## Architecture

### Frontend

* React
* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui where appropriate

Use existing shadcn/ui components rather than creating custom equivalents when a suitable component exists.

Prefer composition of small components over large monolithic components.

### Backend

The MVP has no custom backend.

Expected architecture:

* Firebase Authentication for identity
* Supabase Postgres (with PostgREST + RLS) as the data backend
* Firebase Hosting for static hosting
* Firebase AI Logic for future AI features
* Firebase Functions only when a server is genuinely required (e.g. payments)

Keep the frontend independent of backend implementation details.

### Authentication

Authentication is handled by Firebase Auth

Do not implement authentication, password storage, session management or token verification from scratch.

There is no organisation or multi-tenant model.

Do not introduce RBAC unless a concrete product requirement requires it.

### Database

The application uses a relational PostgreSQL database.

Keep domain relationships explicit and relational.

Do not introduce a document database merely for convenience.

## Domain Model

The primary concepts are:

There are two layers:

* **Library** - reusable items and bags the user maintains and reuses across trips.
* **Trip** - what the user is bringing on one occasion, holding trip-scoped copies of library bags and items.

Adding a library bag or item to a trip copies it. Later edits to the library do not change existing packing lists.

### User

Represents an individual Pack Mate user.

A user owns their own trips, packing lists, bags and items.

### Trip

Represents a journey or travel occasion.

A trip may contain a packing list.

### Packing List

Represents what the user is bringing on a trip.

A packing list contains trip-scoped copies of:

* Items
* Optional bags

Packed state and quantity belong to the trip, not the library.

### Item

Represents something the user intends to bring.

Library items are reusable and may be added to any trip. Within a trip, a copied item may:

* Belong to a bag
* Be marked **With Me**
* Have no bag assignment yet

Bag membership and **With Me** are mutually exclusive.

Do not force every item to belong to a bag.

### Bag

Represents a physical bag or container.

Examples:

* Main backpack
* Suitcase
* Daypack
* Toiletry bag

A bag contains zero or more items.

A user may create no bags at all.

A library bag may define default contents. Adding it to a trip copies the bag and its default contents.

### With Me

"With Me" means the user is carrying the item directly rather than putting it inside a bag.

Examples:

* Passport
* Wallet
* Phone
* Keys

Do not use "Carry On" for this concept because "carry-on" commonly refers to airline cabin baggage.

## Coding Principles

### General

* Prefer readable, boring code over clever code.
* Keep functions and components small.
* Use descriptive names.
* Avoid premature abstractions.
* Avoid duplicated business logic.
* Do not silently change existing behaviour while implementing unrelated requirements.

### TypeScript

* Use strict TypeScript.
* Avoid `any`.
* Define explicit types for domain objects and API responses.
* Do not duplicate domain types unnecessarily.
* Prefer type-safe API contracts.

### React

* Prefer functional components.
* Keep components focused on one responsibility.
* Avoid excessive prop drilling.
* Use composition where appropriate.
* Do not put business logic directly into presentation components when it can reasonably be separated.

### Next.js

Follow the current Next.js conventions used by the project.

Prefer server-side functionality where appropriate.

Do not add client-side state or `"use client"` unnecessarily.

### Styling

* Use Tailwind CSS.
* Use shadcn/ui for standard UI primitives where appropriate.
* Avoid introducing another CSS framework.
* Avoid arbitrary custom CSS unless Tailwind/shadcn cannot reasonably achieve the requirement.
* Maintain consistent spacing, typography and responsive behaviour.

## API Principles

* Data access uses Supabase PostgREST; first-party calls are not required to be REST/OpenAPI.
* Public or external APIs (if any) should be RESTful, predictable, and documented with OpenAPI.
* Validate input at the boundary.
* Never trust client-provided ownership information.
* Authorisation must be enforced by Supabase RLS, not by the frontend.
* A user must never be able to access another user's resources by changing an ID in a request.

Example:

`GET /trips/{tripId}`

The backend must verify that the authenticated user owns the trip.

Do not rely on the frontend to enforce ownership.

## Security

Security is a first-class requirement.

* Never commit secrets.
* Never hard-code credentials.
* Never expose server-side secrets to the browser.
* Validate all external input.
* Enforce authentication and authorisation server-side.
* Use parameterised database queries.
* Do not log access tokens, passwords or sensitive personal information.
* Follow least-privilege principles for AWS resources.

## Dependencies

Before adding a dependency:

1. Check whether the existing stack already provides the required functionality.
2. Check whether the functionality can be implemented simply without a dependency.
3. Prefer established, actively maintained libraries.
4. Avoid adding dependencies for trivial functionality.

Do not add a library merely because it is popular.

## UI/UX

The interface should feel:

* Simple
* Modern
* Lightweight
* Consumer-oriented
* Mobile-friendly

Avoid:

* Enterprise dashboards
* Excessive tables
* Dense configuration screens
* Unnecessary modals
* Excessive onboarding
* Features that require users to understand the underlying data model

The UI should reflect the user's mental model rather than the database model.

For example, users should think:

> "I need to pack my passport."

rather than:

> "I need to create an item entity and assign it to a container."

## Implementation Rules for Agents

Before making changes:

1. Understand the existing implementation.
2. Identify the smallest change that satisfies the requirement.
3. Follow existing project conventions.
4. Check related components, APIs and domain models before changing them.
5. Do not modify unrelated files.

When implementing a feature:

1. Update the domain model if required.
2. Update the API contract if required.
3. Implement backend behaviour.
4. Implement frontend behaviour.
5. Add or update tests.
6. Check responsive behaviour.
7. Check error and empty states.

Do not consider a feature complete merely because the happy path works.

## Testing

Tests should cover:

* Normal behaviour
* Validation failures
* Authentication failures
* Authorisation failures
* Empty states
* Important edge cases

For domain logic, prefer unit tests.

For API behaviour, test the complete request/response behaviour where practical.

Do not write tests that merely reproduce implementation details.

## Git

Keep changes focused.

Prefer small, logically coherent commits.

Do not:

* Commit generated files unnecessarily.
* Commit secrets or local configuration.
* Reformat unrelated files.
* Mix unrelated refactoring with feature work.

## Agent Behaviour

When requirements are ambiguous:

* Prefer the existing product principles and domain model.
* Do not invent complex functionality.
* Ask for clarification when the ambiguity materially affects architecture or user behaviour.
* Otherwise choose the simplest reasonable interpretation.

When proposing a solution, explain significant architectural trade-offs briefly.

Do not introduce:

* Multi-tenancy
* Organisations/workspaces
* Enterprise RBAC
* Microservices
* Event-driven architecture
* Kubernetes
* Complex caching
* Complex state-management libraries

unless explicitly required.

The goal is to build a maintainable B2C product, not an enterprise platform.

## Definition of Done

A change is complete when:

* The requested behaviour works.
* Existing functionality still works.
* The implementation follows the project's architecture and conventions.
* Appropriate validation exists.
* Authentication and authorisation are correctly enforced where applicable.
* Tests have been added or updated where appropriate.
* The UI works on mobile and desktop.
* No unnecessary dependencies or architectural complexity have been introduced.
