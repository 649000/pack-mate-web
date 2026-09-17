import Link from "next/link";
import { Backpack, Check, ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTable,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { WeightSummary } from "@/components/packing/weight-summary";
import { CategoryBadge } from "@/components/packing/category-badge";
import {
  buildBagTree,
  entryLocationPath,
  groupEntries,
  packingProgress,
  type BagNode,
} from "@/lib/packing";
import {
  formatWeight,
  sumBagWeight,
  tripBaggageTotal,
  weightByCategory,
  type WeightTotal,
} from "@/lib/weight";
import { ITEM_CATEGORY_LABELS } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { DisplayWeightUnit, SharedTrip, SharedTripBag, SharedTripEntry } from "@/lib/types";

function formatDates(trip: SharedTrip["trip"]): string {
  if (!trip.start_date && !trip.end_date) return "";
  if (trip.start_date && trip.end_date) return `${trip.start_date} to ${trip.end_date}`;
  return trip.start_date ?? trip.end_date ?? "";
}

function PackedIndicator({ packed }: { packed: boolean }) {
  return (
    <span
      role="img"
      aria-label={packed ? "Packed" : "Not packed"}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
        packed ? "border-primary bg-primary text-primary-foreground" : "border-input",
      )}
    >
      {packed ? <Check className="size-3" /> : null}
    </span>
  );
}

function SharedEntryRow({
  entry,
  bags,
  unit,
}: {
  entry: SharedTripEntry;
  bags: SharedTripBag[];
  unit: DisplayWeightUnit;
}) {
  const hasDetails = Boolean(entry.description || entry.link || entry.image_url);
  const locationPath = entryLocationPath(entry, bags);
  const nestedPath = locationPath.includes(" > ") ? locationPath : null;

  return (
    <div className="rounded-md border bg-card px-2 py-2 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-2">
        <PackedIndicator packed={entry.is_packed} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            entry.is_packed && "text-muted-foreground line-through",
          )}
        >
          {entry.name}
        </span>
        <CategoryBadge category={entry.category} />
        {entry.qty > 1 ? <span className="text-xs text-muted-foreground">x{entry.qty}</span> : null}
        {entry.weight_grams !== null ? (
          <span className="text-xs text-muted-foreground">
            {formatWeight(entry.weight_grams * entry.qty, unit)}
          </span>
        ) : null}
      </div>
      {nestedPath ? <p className="pl-6 text-xs text-muted-foreground">{nestedPath}</p> : null}
      {hasDetails ? (
        <details className="pl-6 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Details</summary>
          <div className="mt-2 flex flex-col gap-2">
            {entry.image_url ? (
              <img
                src={entry.image_url}
                alt={entry.name}
                className="size-20 rounded-md border object-cover"
              />
            ) : null}
            {entry.description ? <p className="whitespace-pre-wrap">{entry.description}</p> : null}
            {entry.link ? (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary underline"
              >
                {entry.link}
              </a>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function SharedEntryGroup({
  title,
  entries,
  bags,
  unit,
  weight,
  limitGrams,
}: {
  title: string;
  entries: SharedTripEntry[];
  bags: SharedTripBag[];
  unit: DisplayWeightUnit;
  weight?: WeightTotal;
  limitGrams?: number | null;
}) {
  const packed = entries.filter((entry) => entry.is_packed).length;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          {title}
          <span className="text-xs font-normal text-muted-foreground">
            {packed}/{entries.length} packed
          </span>
          {weight ? (
            <WeightSummary weight={weight} limitGrams={limitGrams ?? null} unit={unit} />
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardTable className="flex flex-col gap-2 p-4">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here yet.</p>
        ) : (
          entries.map((entry) => (
            <SharedEntryRow key={entry.id} entry={entry} bags={bags} unit={unit} />
          ))
        )}
      </CardTable>
    </Card>
  );
}

export function SharedTripView({
  trip,
  bags,
  entries,
  unit = "kg",
}: {
  trip: SharedTrip["trip"];
  bags: SharedTripBag[];
  entries: SharedTripEntry[];
  unit?: DisplayWeightUnit;
}) {
  const progress = packingProgress(entries);
  const { byBag, withMe, loose } = groupEntries(entries, bags);
  const baggageTotal = tripBaggageTotal(bags, entries);
  const categoryBreakdown = weightByCategory(entries);
  const bagTree = buildBagTree(bags);
  const dates = formatDates(trip);

  function renderBagTree(nodes: BagNode<SharedTripBag>[], depth: number) {
    return nodes.map((node) => (
      <div key={node.bag.id} className="flex flex-col gap-4">
        <SharedEntryGroup
          title={node.bag.name}
          entries={byBag.get(node.bag.id) ?? []}
          bags={bags}
          unit={unit}
          weight={sumBagWeight(node.bag, bags, entries)}
          limitGrams={node.bag.weight_limit_grams}
        />
        {node.children.length > 0 ? (
          <div
            className={
              depth < 3 ? "flex flex-col gap-4 border-l pl-3 sm:pl-4" : "flex flex-col gap-4"
            }
          >
            {renderBagTree(node.children, depth + 1)}
          </div>
        ) : null}
      </div>
    ));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl leading-none font-medium text-foreground">{trip.name}</h1>
        {dates ? <p className="text-sm text-muted-foreground">{dates}</p> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {progress.packed} of {progress.total} packed
            </span>
            <span className="text-muted-foreground">
              Baggage {formatWeight(baggageTotal.grams, unit)}
              {baggageTotal.complete ? "" : " (incomplete)"}
            </span>
          </div>
          <Progress value={progress.total === 0 ? 0 : (progress.packed / progress.total) * 100} />
        </CardContent>
      </Card>

      {categoryBreakdown.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Weight by category</CardTitle>
            <CardDescription>
              Whole list, including With Me and unassigned items. Separate from the baggage total.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {categoryBreakdown.map((row) => (
              <div
                key={row.category ?? "uncategorised"}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {row.category === null ? "Uncategorised" : ITEM_CATEGORY_LABELS[row.category]}
                </span>
                <span className="text-muted-foreground">
                  {formatWeight(row.grams, unit)}
                  {row.complete ? "" : " (incomplete)"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {entries.length === 0 && bags.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="This packing list is empty."
            description="Nothing has been added to this list yet."
          />
        </Card>
      ) : null}

      {renderBagTree(bagTree, 0)}

      {withMe.length > 0 ? (
        <SharedEntryGroup title="With Me" entries={withMe} bags={bags} unit={unit} />
      ) : null}

      {loose.length > 0 ? (
        <SharedEntryGroup title="Not assigned" entries={loose} bags={bags} unit={unit} />
      ) : null}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Backpack className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Made with Pack Mate</span>
              <span className="text-xs text-muted-foreground">
                Build your own packing list for free.
              </span>
            </div>
          </div>
          <Button asChild>
            <Link href="/sign-in">Create your own list</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
