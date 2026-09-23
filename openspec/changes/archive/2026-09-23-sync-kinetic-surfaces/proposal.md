## Why

Review of the redesigned app settled several presentation decisions that the `design-system` spec does not yet describe: the dashboard is the signed-in home and the trips list is the management surface, the bag and item libraries have their own treatments, the shell has no notifications control, and item lists no longer support hiding columns. This change brings the spec in line with what was built. It changes no behaviour.

## What Changes

- Describe the signed-in home as the dashboard: stat tiles, next journey with progress and weight, and an upcoming/recent trips list, read-only.
- Describe the trips surface as the management list: filter chips, a featured next departure, current/upcoming and past sections, and summary stats.
- Describe the bag library as cards showing each bag's default contents and weight limit, and the item library as a table of items with specification, category, default quantity and mass.
- State that the shell presents no notifications control, and that the account control holds account, theme and sign-out beside it.
- Replace the "columns can be hidden" expectation on list surfaces with search and sort (and category filtering on the item library).
- Correct the spec purpose so it names the Stitch design systems rather than the retired Metronic reference.

## Impact

- **Specification only** — no application code changes.
- `design-system`: the purpose and several requirements are revised to match the implemented design.
