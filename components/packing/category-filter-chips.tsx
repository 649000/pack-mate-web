import { Button } from "@/components/ui/button";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { categoriesInUse, hasUncategorised, type CategoryFilter } from "@/lib/packing";
import type { ItemCategory } from "@/lib/types";

type Option = { value: CategoryFilter; label: string };

function categoryFilterOptions<E extends { category: ItemCategory | null }>(
  entries: E[],
  value: CategoryFilter,
): Option[] {
  const options: Option[] = [
    { value: "all", label: "All" },
    ...categoriesInUse(entries).map((category) => ({
      value: category as CategoryFilter,
      label: ITEM_CATEGORY_LABELS[category],
    })),
  ];
  if (hasUncategorised(entries)) {
    options.push({ value: "uncategorised", label: "Uncategorised" });
  }
  // Keep a selected category visible even after its last entry is removed, so
  // the active filter never disappears out from under the user.
  if (value !== "all" && !options.some((option) => option.value === value)) {
    options.push({
      value,
      label: value === "uncategorised" ? "Uncategorised" : ITEM_CATEGORY_LABELS[value],
    });
  }
  return options;
}

export function CategoryFilterChips<E extends { category: ItemCategory | null }>({
  entries,
  value,
  onChange,
  label = "Filter by category",
}: {
  entries: E[];
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  label?: string;
}) {
  const options = categoryFilterOptions(entries, value);

  return (
    <div
      role="group"
      aria-label={label}
      // One scrollable row on small screens; wraps to show everything on wide
      // screens. Avoids a tall stack of chips on mobile and clipping on desktop.
      className="flex min-w-0 gap-1.5 overflow-x-auto py-0.5 lg:flex-wrap lg:overflow-x-visible"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "primary" : "outline"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="shrink-0"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function CategoryFilterSelect<E extends { category: ItemCategory | null }>({
  entries,
  value,
  onChange,
  label = "Filter by category",
  className,
}: {
  entries: E[];
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  label?: string;
  className?: string;
}) {
  const options = categoryFilterOptions(entries, value);

  return (
    <select
      aria-label={label}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value as CategoryFilter)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
