"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { formatWeight, type CategoryWeight } from "@/lib/weight";
import type { DisplayWeightUnit } from "@/lib/types";

const chartConfig = {
  grams: { label: "Weight", color: "var(--chart-1)" },
} satisfies ChartConfig;

function categoryLabel(category: CategoryWeight["category"]): string {
  return category === null ? "Uncategorised" : ITEM_CATEGORY_LABELS[category];
}

export function WeightByCategoryChart({
  rows,
  unit,
}: {
  rows: CategoryWeight[];
  unit: DisplayWeightUnit;
}) {
  const data = rows.map((row) => ({
    label: categoryLabel(row.category),
    grams: row.grams,
    // A non-breaking space keeps Recharts from wrapping the label onto two
    // lines inside the SVG.
    formatted: formatWeight(row.grams, unit).replace(/ /g, "\u00A0"),
    complete: row.complete,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No weights yet.</p>;
  }

  const hasIncomplete = data.some((row) => !row.complete);

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto w-full"
        style={{ height: data.length * 32 + 16 }}
        role="img"
        aria-label="Weight by category"
      >
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }}>
          <XAxis type="number" dataKey="grams" hide />
          <YAxis type="category" dataKey="label" width={160} tickLine={false} axisLine={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent formatter={(value) => formatWeight(Number(value), unit)} />
            }
          />
          <Bar dataKey="grams" radius={4} isAnimationActive={false}>
            {data.map((row, index) => (
              <Cell
                key={`cell-${index}`}
                fill={row.complete ? "var(--chart-1)" : "var(--muted-foreground)"}
              />
            ))}
            <LabelList dataKey="formatted" position="right" className="fill-foreground" />
          </Bar>
        </BarChart>
      </ChartContainer>
      {hasIncomplete ? (
        <p className="text-xs text-muted-foreground">Grey bars include items with no weight.</p>
      ) : null}
    </div>
  );
}
