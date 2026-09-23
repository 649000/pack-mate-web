## Context

Themes are provided by `next-themes` (`attribute="class"`, `defaultTheme="light"`, system disabled) and toggled in the account menu. `next-themes` persists to local storage, which is per device. `profiles` already stores user preferences such as `weight_unit`.

## Goals / Non-Goals

**Goals:**

- Persist the theme on the account and apply it across devices.
- Keep rendering flash-free on a returning device.

**Non-Goals:**

- A per-device theme that intentionally differs from the account.
- A `system` option (system is disabled today).
- Themeing beyond light/dark.

## Decisions

- **`theme` lives on `profiles`**, consistent with `weight_unit`, with a `check (theme in ('light','dark'))` constraint and a `lib/validation.ts` counterpart, mirroring the existing pattern.
- **A targeted upsert** (`user_id` + `theme` only) writes the preference, so toggling the theme never clears the other profile fields (`display_name`, `birthday`, `gender`).
- **The profile is the source of truth; the theme library's local cache remains a render cache only.** A `ThemeSync` component applies the stored theme once the signed-in profile loads. On a returning device the local cache renders the right theme before hydration (no flash); on a new device the default theme is applied first and corrected when the profile loads. This is accepted rather than adding a server cookie, which would be another per-device store and more moving parts.
- **Toggling persists best-effort**: the theme is applied immediately, and a failed write does not block the UI.

## Risks / Trade-offs

- **A brief flash on a brand-new device** before the stored theme loads. Acceptable; mitigated by the local cache on returning devices.
- **Two sources for the same value** (profile and local cache). This is deliberate: the profile is authoritative and the cache is disposable.
