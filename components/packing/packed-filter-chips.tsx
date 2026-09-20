import { Button } from "@/components/ui/button";
import type { PackedFilter } from "@/lib/packing";

export function PackedFilterChips({
  value,
  onChange,
  label = "Filter entries by packed state",
}: {
  value: PackedFilter;
  onChange: (value: PackedFilter) => void;
  label?: string;
}) {
  const chips: { value: PackedFilter; label: string }[] = [
    { value: "all", label: "All items" },
    { value: "unpacked", label: "To pack" },
    { value: "packed", label: "Packed" },
  ];

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
