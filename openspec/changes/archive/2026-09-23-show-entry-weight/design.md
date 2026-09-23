## Context

Trip entries carry `weight_grams`, and the trip already renders group/trip totals via `WeightSummary` and the weight-by-category chart. The row itself (`SortableEntry`) shows the name, category, quantity input, location and actions — but not the weight, so the value is invisible while packing.

## Goals / Non-Goals

**Goals:**

- Make an entry's weight visible in its row, in the chosen unit.

**Non-Goals:**

- Editing weight from the row (that stays in the item-details dialog).
- Changing how totals or limits are computed.

## Decisions

- **Show the entry's own weight**, not `weight × qty`: the group and trip totals already aggregate quantity, and the item-details dialog edits the per-unit weight, so the row stays consistent with what is edited there. The value is rendered in the tabular monospace face used for other numbers.
- **Only when set**, so rows without a weight stay uncluttered and the layout is unchanged for them.
- **Derived at render**, like the other weight displays; nothing new is persisted.

## Risks / Trade-offs

- **Row density** increases slightly on phones. Mitigated by showing a short value only when present and keeping it alongside the existing controls rather than on its own line.
