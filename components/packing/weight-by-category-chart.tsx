import { cn } from "@/lib/utils";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { formatWeight, type CategoryWeight } from "@/lib/weight";
import type { DisplayWeightUnit } from "@/lib/types";

function categoryLabel(category: CategoryWeight["category"]): string {
  return category === null ? "Uncategorised" : ITEM_CATEGORY_LABELS[category];
}

// A compact breakdown list rather than a chart: one thin bar per category,
// scaled to the heaviest category, so the whole thing stays short.
export function WeightByCategoryChart({
  rows,
  unit,
}: {
  rows: CategoryWeight[];
  unit: DisplayWeightUnit;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No weights yet.</p>;
  }

  const max = Math.max(...rows.map((row) => row.grams));
  const hasIncomplete = rows.some((row) => !row.complete);

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.category ?? "uncategorised"} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-muted-foreground">
              {categoryLabel(row.category)}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full"
                style={{
                  width: max === 0 ? "0%" : `${(row.grams / max) * 100}%`,
                  backgroundColor: row.complete ? "var(--chart-1)" : "var(--muted-foreground)",
                }}
              />
            </span>
            <span
              className={cn(
                "w-16 shrink-0 text-right font-mono text-xs tabular-nums",
                row.complete ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {formatWeight(row.grams, unit)}
            </span>
          </li>
        ))}
      </ul>
      {hasIncomplete ? (
        <p className="text-xs text-muted-foreground">Grey bars include items with no weight.</p>
      ) : null}
    </div>
  );
}
