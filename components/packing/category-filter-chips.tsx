import { Button } from "@/components/ui/button";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { categoriesInUse, hasUncategorised, type CategoryFilter } from "@/lib/packing";
import type { ItemCategory } from "@/lib/types";

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
  const chips: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...categoriesInUse(entries).map((category) => ({
      value: category as CategoryFilter,
      label: ITEM_CATEGORY_LABELS[category],
    })),
  ];
  if (hasUncategorised(entries)) {
    chips.push({ value: "uncategorised", label: "Uncategorised" });
  }
  // Keep a selected category visible even after its last entry is removed, so
  // the active filter never disappears out from under the user.
  if (value !== "all" && !chips.some((chip) => chip.value === value)) {
    chips.push({
      value,
      label: value === "uncategorised" ? "Uncategorised" : ITEM_CATEGORY_LABELS[value],
    });
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Button
          key={chip.value}
          type="button"
          size="sm"
          variant={value === chip.value ? "primary" : "outline"}
          aria-pressed={value === chip.value}
          onClick={() => onChange(chip.value)}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}
