import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PackedFilter } from "@/lib/packing";

export function PackedFilterChips({
  value,
  onChange,
  counts,
  label = "Filter entries by packed state",
  className,
}: {
  value: PackedFilter;
  onChange: (value: PackedFilter) => void;
  counts?: { total: number; packed: number; unpacked: number };
  label?: string;
  className?: string;
}) {
  const chips: { value: PackedFilter; label: string; count?: number }[] = [
    { value: "all", label: "All", count: counts?.total },
    { value: "unpacked", label: "Unpacked", count: counts?.unpacked },
    { value: "packed", label: "Packed", count: counts?.packed },
  ];

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
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
          {chip.count !== undefined ? (
            <span className="font-mono text-xs tabular-nums opacity-70">{chip.count}</span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}
