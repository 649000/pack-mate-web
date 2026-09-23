import { formatWeight, isOverLimit, type WeightTotal } from "@/lib/weight";
import type { DisplayWeightUnit } from "@/lib/types";

export function WeightSummary({
  weight,
  limitGrams,
  unit,
}: {
  weight: WeightTotal;
  limitGrams: number | null;
  unit: DisplayWeightUnit;
}) {
  const over = isOverLimit(weight.grams, limitGrams);
  const suffix = limitGrams !== null ? (over ? " · over limit" : " · under limit") : "";
  return (
    <span
      className={
        over
          ? "font-mono text-xs font-normal tabular-nums text-warning-soft-foreground"
          : "font-mono text-xs font-normal tabular-nums text-muted-foreground"
      }
    >
      {formatWeight(weight.grams, unit)}
      {limitGrams !== null ? ` / ${formatWeight(limitGrams, unit)}` : ""}
      {weight.complete ? "" : " (incomplete)"}
      {suffix}
    </span>
  );
}
