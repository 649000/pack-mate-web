## Why

The chosen theme is only persisted in the browser's local storage, so it does not follow a user between desktop and mobile. The app is used on both, so a preference the user sets should live on their account.

## What Changes

- Add a **theme preference** (`light` or `dark`) to the user's profile, defaulting to `light`.
- **Persist** the toggle to the profile and **apply** the profile's theme when a signed-in user loads the app, so the choice follows them across devices.
- Keep the client theme library's local cache for instant, flash-free rendering on the a device; the profile remains the source of truth.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `design-system`: the chosen theme is persisted on the user's account and applied across devices.

## Impact

- **Database**: add a constrained `theme` column to `profiles`.
- **Domain**: `ProfileTheme` type, `validateTheme`, and a profile theme accessor in `lib/data.ts`.
- **UI**: a small sync component and the account menu toggle, which now writes the preference.
- **Tests**: unit tests for validation and the theme write; integration coverage via the existing profile RLS tests.
