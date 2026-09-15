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
  return (
    <span className="text-xs font-normal text-muted-foreground">
      {formatWeight(weight.grams, unit)}
      {limitGrams !== null ? ` / ${formatWeight(limitGrams, unit)}` : ""}
      {weight.complete ? "" : " (incomplete)"}
      {limitGrams !== null ? (over ? " · over limit" : " · under limit") : ""}
    </span>
  );
}
