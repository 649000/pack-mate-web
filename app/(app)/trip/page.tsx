"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  GripVertical,
  Hand,
  Luggage,
  PackageOpen,
  PackageCheck,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Weight,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSearchToolbar } from "@/components/list-search";
import { LibraryPicker, type LibraryPickerOption } from "@/components/library-picker";
import { RecordAction } from "@/components/record-action";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  addAdHocEntry,
  addLibraryBagToTrip,
  addLibraryItemToTrip,
  createShareLink,
  deleteEntry,
  getActiveShareLink,
  getProfile,
  getTrip,
  listBags,
  listItems,
  listTripBags,
  listTripEntries,
  regenerateShareLink,
  reorderEntries,
  setBagParent,
  setEntryLocation,
  updateEntry,
} from "@/lib/data";
import {
  bagDescendantIds,
  buildBagTree,
  destinationBagId,
  destinationToLocation,
  entryLocationPath,
  filterEntriesByCategory,
  groupEntries,
  locationValue,
  packingProgress,
  searchEntries,
  type BagNode,
  type CategoryFilter,
  type Destination,
} from "@/lib/packing";
import type {
  DisplayWeightUnit,
  ItemCategory,
  ReusableBag,
  ReusableItem,
  ShareLink,
  Trip,
  TripBag,
  TripEntry,
} from "@/lib/types";
import {
  ITEM_CATEGORY_GROUPS,
  ITEM_CATEGORY_LABELS,
  parseQty,
  validateName,
} from "@/lib/validation";
import {
  formatWeight,
  sumBagWeight,
  tripBaggageTotal,
  weightByCategory,
  type WeightTotal,
} from "@/lib/weight";
import { WeightSummary } from "@/components/packing/weight-summary";
import { CategoryBadge } from "@/components/packing/category-badge";
import { CategoryFilterChips } from "@/components/packing/category-filter-chips";
import { ExportPdfDialog } from "@/components/packing/export-pdf-dialog";
import { buildTripPdfViewModel } from "@/lib/pdf";
import {
  buildShareUrl,
  SHARE_EXPIRY_OPTIONS,
  shareExpiryToDate,
  type ShareExpiry,
} from "@/lib/share";
import { cn } from "@/lib/utils";

function SortableEntry({
  entry,
  bags,
  onTogglePacked,
  onMove,
  onChangeQty,
  onDelete,
  onEditDetails,
}: {
  entry: TripEntry;
  bags: TripBag[];
  onTogglePacked: (entry: TripEntry) => void;
  onMove: (entry: TripEntry, destination: Destination) => void;
  onChangeQty: (entry: TripEntry, qty: number) => void;
  onDelete: (entry: TripEntry) => void;
  onEditDetails: (entry: TripEntry) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(entry.description || entry.link || entry.image_url);
  const locationPath = entryLocationPath(entry, bags);
  const nestedPath = locationPath.includes(" > ") ? locationPath : null;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded-sm px-1 text-muted-foreground hover:text-foreground"
          aria-label="Reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <Checkbox
          checked={entry.is_packed}
          onCheckedChange={() => onTogglePacked(entry)}
          aria-label={entry.is_packed ? "Mark unpacked" : "Mark packed"}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                entry.is_packed
                  ? "text-sm text-muted-foreground line-through"
                  : "text-sm text-foreground"
              }
            >
              {entry.name}
            </span>
            <CategoryBadge category={entry.category} />
          </div>
          {nestedPath ? (
            <span className="truncate text-xs text-muted-foreground">{nestedPath}</span>
          ) : null}
        </div>
        <Input
          type="number"
          min={1}
          step={1}
          defaultValue={entry.qty}
          className="h-7 w-14 px-2 text-xs"
          aria-label={`Quantity for ${entry.name}`}
          onBlur={(event) => onChangeQty(entry, Number(event.target.value))}
        />
        <select
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
          value={locationValue(entry)}
          onChange={(event) => onMove(entry, event.target.value)}
          aria-label="Location"
        >
          <option value="loose">Loose</option>
          <option value="with_me">With Me</option>
          {bags.map((bag) => (
            <option key={bag.id} value={`bag:${bag.id}`}>
              {bag.name}
            </option>
          ))}
        </select>
        {hasDetails ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                mode="icon"
                size="sm"
                aria-expanded={expanded}
                aria-label={
                  expanded ? `Hide details for ${entry.name}` : `Show details for ${entry.name}`
                }
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{expanded ? "Hide details" : "Show details"}</TooltipContent>
          </Tooltip>
        ) : null}
        <RecordAction icon={Pencil} label="Edit" onClick={() => onEditDetails(entry)} />
        <RecordAction icon={Trash2} label="Remove" onClick={() => onDelete(entry)} />
      </div>
      {expanded ? (
        <div className="mt-2 flex flex-col gap-2 pl-8 text-xs text-muted-foreground">
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
      ) : null}
    </div>
  );
}

function EntryGroup({
  title,
  icon: Icon,
  entries,
  bags,
  unit,
  weight,
  limitGrams,
  headerActions,
  onTogglePacked,
  onMove,
  onChangeQty,
  onDelete,
  onReorder,
  onEditDetails,
}: {
  title: string;
  icon: typeof Luggage;
  entries: TripEntry[];
  bags: TripBag[];
  unit: DisplayWeightUnit;
  weight?: WeightTotal;
  limitGrams?: number | null;
  headerActions?: ReactNode;
  onTogglePacked: (entry: TripEntry) => void;
  onMove: (entry: TripEntry, destination: Destination) => void;
  onChangeQty: (entry: TripEntry, qty: number) => void;
  onDelete: (entry: TripEntry) => void;
  onReorder: (ordered: TripEntry[]) => void;
  onEditDetails: (entry: TripEntry) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((entry) => entry.id === active.id);
    const newIndex = entries.findIndex((entry) => entry.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(entries, oldIndex, newIndex));
  }

  return (
    <section aria-label={title} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 px-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {entries.filter((entry) => entry.is_packed).length}/{entries.length} packed
        </span>
        {weight ? (
          <WeightSummary weight={weight} limitGrams={limitGrams ?? null} unit={unit} />
        ) : null}
        {headerActions ? <span className="ms-auto">{headerActions}</span> : null}
      </div>
      <div className="divide-y divide-border">
        {entries.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">Nothing here yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((entry) => entry.id)}
              strategy={verticalListSortingStrategy}
            >
              {entries.map((entry) => (
                <SortableEntry
                  key={entry.id}
                  entry={entry}
                  bags={bags}
                  onTogglePacked={onTogglePacked}
                  onMove={onMove}
                  onChangeQty={onChangeQty}
                  onDelete={onDelete}
                  onEditDetails={onEditDetails}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}

export function TripView() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("id") ?? "";

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bags, setBags] = useState<TripBag[]>([]);
  const [entries, setEntries] = useState<TripEntry[]>([]);
  const [libraryBags, setLibraryBags] = useState<ReusableBag[]>([]);
  const [libraryItems, setLibraryItems] = useState<ReusableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"item" | "bag" | "oneoff">("item");
  const [addBagId, setAddBagId] = useState("");
  const [addItemId, setAddItemId] = useState("");
  const [addItemDestination, setAddItemDestination] = useState<Destination>("loose");
  const [adhocName, setAdhocName] = useState("");
  const [adhocQty, setAdhocQty] = useState("1");
  const [adhocDestination, setAdhocDestination] = useState<Destination>("loose");
  const adhocInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [unit, setUnit] = useState<DisplayWeightUnit>("kg");
  const [weightOpen, setWeightOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<TripEntry | null>(null);
  const [detailDescription, setDetailDescription] = useState("");
  const [detailLink, setDetailLink] = useState("");
  const [detailImageUrl, setDetailImageUrl] = useState("");
  const [detailCategory, setDetailCategory] = useState<ItemCategory | "">("");
  const [savingDetails, setSavingDetails] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareExpiry, setShareExpiry] = useState<ShareExpiry>("never");
  const [shareBusy, setShareBusy] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  function openAdd(mode: "item" | "bag" | "oneoff") {
    setAddMode(mode);
    setAddOpen(true);
  }

  function openShare() {
    setShareOpen(true);
    setShareLink(null);
    setShareUrl("");
    setShareExpiry("never");
    setShareBusy(true);
    getActiveShareLink(tripId)
      .then((link) => {
        setShareLink(link);
        if (link) setShareUrl(buildShareUrl(link.token, window.location.origin));
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load the share link");
      })
      .finally(() => setShareBusy(false));
  }

  async function handleCreateShare() {
    setShareBusy(true);
    try {
      const link = await createShareLink(tripId, shareExpiryToDate(shareExpiry));
      setShareLink(link);
      setShareUrl(buildShareUrl(link.token, window.location.origin));
      toast.success("Share link created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create the share link");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleRegenerateShare() {
    if (!shareLink) return;
    setShareBusy(true);
    try {
      const link = await regenerateShareLink(shareLink.id, {
        expiresAt: shareExpiryToDate(shareExpiry),
      });
      setShareLink(link);
      setShareUrl(buildShareUrl(link.token, window.location.origin));
      toast.success("New share link created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate the link");
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  function refresh() {
    if (!tripId) return Promise.resolve();
    return Promise.all([
      getTrip(tripId),
      listTripBags(tripId),
      listTripEntries(tripId),
      listBags(),
      listItems(),
    ])
      .then(([nextTrip, nextBags, nextEntries, nextLibraryBags, nextLibraryItems]) => {
        setTrip(nextTrip);
        setBags(nextBags);
        setEntries(nextEntries);
        setLibraryBags(nextLibraryBags);
        setLibraryItems(nextLibraryItems);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to load trip");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        if (profile?.weight_unit) setUnit(profile.weight_unit);
      })
      .catch(() => {});
  }, []);

  const progress = useMemo(() => packingProgress(entries), [entries]);

  const searchedEntries = useMemo(
    () => (search.trim() ? searchEntries(entries, search) : entries),
    [entries, search],
  );

  const filteredEntries = useMemo(
    () => filterEntriesByCategory(searchedEntries, categoryFilter),
    [searchedEntries, categoryFilter],
  );

  const {
    byBag: entriesByBag,
    withMe: withMeEntries,
    loose: looseEntries,
  } = useMemo(() => groupEntries(filteredEntries, bags), [filteredEntries, bags]);

  const categoryBreakdown = useMemo(() => weightByCategory(entries), [entries]);

  const baggageTotal = useMemo(() => tripBaggageTotal(bags, entries), [bags, entries]);

  const bagTree = useMemo(() => buildBagTree(bags), [bags]);

  const libraryBagOptions = useMemo<LibraryPickerOption[]>(
    () => libraryBags.map((bag) => ({ id: bag.id, name: bag.name })),
    [libraryBags],
  );

  const libraryItemOptions = useMemo<LibraryPickerOption[]>(
    () =>
      libraryItems.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.category ? ITEM_CATEGORY_LABELS[item.category] : undefined,
      })),
    [libraryItems],
  );

  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    try {
      await action();
      toast.success(success);
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    }
  }

  async function handleAddBag() {
    if (!addBagId) return;
    const ok = await run(async () => {
      await addLibraryBagToTrip(tripId, addBagId);
      setAddBagId("");
    }, "Bag added");
    if (ok) setAddOpen(false);
  }

  async function handleAddLibraryItem() {
    if (!addItemId) return;
    const destination = addItemDestination;
    const ok = await run(async () => {
      const bagId = destinationBagId(destination);
      const entryId = await addLibraryItemToTrip(tripId, addItemId, bagId);
      if (destination === "with_me") {
        await updateEntry(entryId, { trip_bag_id: null, is_with_me: true });
      }
      setAddItemId("");
    }, "Item added");
    if (ok) setAddOpen(false);
  }

  async function handleAddAdHoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const destination = adhocDestination;
    const ok = await run(async () => {
      const bagId = destinationBagId(destination);
      const entry = await addAdHocEntry({
        tripId,
        name: validateName(adhocName, "Item name"),
        qty: parseQty(adhocQty),
        tripBagId: bagId,
      });
      if (destination === "with_me") {
        await updateEntry(entry.id, { trip_bag_id: null, is_with_me: true });
      }
      setAdhocName("");
      setAdhocQty("1");
    }, "Item added");
    if (ok) setAddOpen(false);
  }

  function handleTogglePacked(entry: TripEntry) {
    void run(() => updateEntry(entry.id, { is_packed: !entry.is_packed }), "Updated");
  }

  function handleMove(entry: TripEntry, destination: Destination) {
    void run(() => setEntryLocation(entry, destinationToLocation(destination)), "Moved");
  }

  function handleChangeQty(entry: TripEntry, qty: number) {
    if (!Number.isInteger(qty) || qty < 1 || qty === entry.qty) return;
    void run(() => updateEntry(entry.id, { qty }), "Quantity updated");
  }

  function handleDelete(entry: TripEntry) {
    void run(() => deleteEntry(entry.id), "Removed");
  }

  function handleReorder(ordered: TripEntry[]) {
    setEntries((current) =>
      current.map((entry) => {
        const index = ordered.findIndex((candidate) => candidate.id === entry.id);
        return index === -1 ? entry : { ...entry, position: index };
      }),
    );
    void run(() => reorderEntries(ordered), "Reordered");
  }

  function handleMoveBag(bag: TripBag, parentBagId: string | null) {
    const parent = parentBagId
      ? (bags.find((candidate) => candidate.id === parentBagId) ?? null)
      : null;
    void run(() => setBagParent(bag, parent), "Bag moved");
  }

  function renderBagTree(nodes: BagNode[], depth: number): ReactNode {
    return nodes.map((node) => {
      const descendants = bagDescendantIds(node.bag.id, bags);
      const eligibleParents = bags.filter(
        (candidate) => candidate.id !== node.bag.id && !descendants.has(candidate.id),
      );
      return (
        <div key={node.bag.id} className="flex flex-col gap-4">
          <EntryGroup
            title={node.bag.name}
            icon={Luggage}
            entries={entriesByBag.get(node.bag.id) ?? []}
            bags={bags}
            unit={unit}
            weight={sumBagWeight(node.bag, bags, entries)}
            limitGrams={node.bag.weight_limit_grams}
            headerActions={
              bags.length > 1 ? (
                <select
                  aria-label={`Parent bag for ${node.bag.name}`}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  value={node.bag.parent_bag_id ?? ""}
                  onChange={(event) => handleMoveBag(node.bag, event.target.value || null)}
                >
                  <option value="">Top level</option>
                  {eligibleParents.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              ) : null
            }
            onTogglePacked={handleTogglePacked}
            onMove={handleMove}
            onChangeQty={handleChangeQty}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onEditDetails={openDetails}
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
      );
    });
  }

  function openDetails(entry: TripEntry) {
    setDetailEntry(entry);
    setDetailDescription(entry.description ?? "");
    setDetailLink(entry.link ?? "");
    setDetailImageUrl(entry.image_url ?? "");
    setDetailCategory(entry.category ?? "");
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailEntry) return;
    setSavingDetails(true);
    try {
      await updateEntry(detailEntry.id, {
        description: detailDescription.trim() || null,
        link: detailLink.trim() || null,
        image_url: detailImageUrl.trim() || null,
        category: detailCategory || null,
      });
      toast.success("Details updated");
      setDetailEntry(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save details");
    } finally {
      setSavingDetails(false);
    }
  }

  if (!tripId) {
    return <p className="text-sm text-muted-foreground">No trip selected.</p>;
  }

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  if (!trip) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Trip not found.</p>
        <Link href="/trips" className="text-sm underline">
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={trip.name}
        breadcrumb={[
          { label: "Packing" },
          { label: "Trips", href: "/trips" },
          { label: trip.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Switch weight unit"
            onClick={() => setUnit(unit === "kg" ? "lb" : "kg")}
          >
            {unit}
          </Button>
          <Button type="button" size="sm" onClick={openShare}>
            Share
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
            Download PDF
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <PackageCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-foreground">
                {progress.packed}/{progress.total} packed
              </span>
              <span className="text-muted-foreground">
                Total {formatWeight(baggageTotal.grams, unit)}
                {baggageTotal.complete ? "" : " (incomplete)"}
              </span>
            </div>
            <Progress
              value={progress.total === 0 ? 0 : (progress.packed / progress.total) * 100}
              className="h-1.5 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => openAdd("item")}>
              <Plus aria-hidden="true" />
              Add to trip
            </Button>
            <div className="min-w-48 flex-1">
              <ListSearchToolbar
                id="trip-search"
                label="Search items"
                value={search}
                onChange={setSearch}
                placeholder="Search this list"
              />
            </div>
          </div>
          {entries.length > 0 ? (
            <CategoryFilterChips
              entries={entries}
              value={categoryFilter}
              onChange={setCategoryFilter}
              label="Filter entries by category"
            />
          ) : null}
        </CardContent>
      </Card>

      {search.trim() && filteredEntries.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`No items match “${search}”.`}
          description="Try a different search term."
        />
      ) : progress.total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing on this list yet."
          description="Pull a bag or an item from your library, or add a one-off item."
          action={
            <Button onClick={() => openAdd("oneoff")}>
              <Plus aria-hidden="true" />
              Add your first item
            </Button>
          }
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No entries in this category."
          description="Choose another category to see the rest of the list."
          action={
            <Button variant="outline" onClick={() => setCategoryFilter("all")}>
              Show all categories
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {search.trim() ? (
            <p className="px-2 text-sm font-medium text-foreground">
              {filteredEntries.length} {filteredEntries.length === 1 ? "match" : "matches"}
            </p>
          ) : null}
          {renderBagTree(bagTree, 0)}
          <EntryGroup
            title="With Me"
            icon={Hand}
            entries={withMeEntries}
            bags={bags}
            unit={unit}
            onTogglePacked={handleTogglePacked}
            onMove={handleMove}
            onChangeQty={handleChangeQty}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onEditDetails={openDetails}
          />
          <EntryGroup
            title="Not assigned"
            icon={PackageOpen}
            entries={looseEntries}
            bags={bags}
            unit={unit}
            onTogglePacked={handleTogglePacked}
            onMove={handleMove}
            onChangeQty={handleChangeQty}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onEditDetails={openDetails}
          />
        </div>
      )}

      {entries.length > 0 ? (
        <Card>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-5 py-3.5 text-sm font-medium text-foreground"
            aria-expanded={weightOpen}
            onClick={() => setWeightOpen((current) => !current)}
          >
            <Weight className="size-4 text-muted-foreground" aria-hidden="true" />
            Weight by category
            <ChevronDown
              className={cn(
                "ms-auto size-4 text-muted-foreground transition-transform",
                weightOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          {weightOpen ? (
            <CardContent className="flex flex-col gap-2 border-t border-border pt-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weights yet.</p>
              ) : (
                categoryBreakdown.map((row) => (
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
                ))
              )}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to trip</DialogTitle>
            <DialogDescription>
              Pull something from your library, or add a one-off.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={addMode}
            onValueChange={(value) => setAddMode(value as "item" | "bag" | "oneoff")}
            className="py-4"
          >
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="item">Library item</TabsTrigger>
              <TabsTrigger value="bag">Library bag</TabsTrigger>
              <TabsTrigger value="oneoff">One-off item</TabsTrigger>
            </TabsList>

            <TabsContent value="item" className="flex flex-col gap-3 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-item">Add an item from your library</Label>
                <LibraryPicker
                  id="add-item"
                  label="Add an item from your library"
                  placeholder="Select an item"
                  value={addItemId}
                  onChange={setAddItemId}
                  options={libraryItemOptions}
                  emptyMessage="No items in your library yet."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-item-destination">Destination</Label>
                <select
                  id="add-item-destination"
                  className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                  value={addItemDestination}
                  onChange={(event) => setAddItemDestination(event.target.value)}
                  aria-label="Destination for library item"
                >
                  <option value="loose">Loose</option>
                  <option value="with_me">With Me</option>
                  {bags.map((bag) => (
                    <option key={bag.id} value={`bag:${bag.id}`}>
                      {bag.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={() => void handleAddLibraryItem()}
                disabled={!addItemId}
              >
                Add item
              </Button>
            </TabsContent>

            <TabsContent value="bag" className="flex flex-col gap-3 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-bag">Add a bag from your library</Label>
                <LibraryPicker
                  id="add-bag"
                  label="Add a bag from your library"
                  placeholder="Select a bag"
                  value={addBagId}
                  onChange={setAddBagId}
                  options={libraryBagOptions}
                  emptyMessage="No bags in your library yet."
                />
              </div>
              <Button type="button" onClick={() => void handleAddBag()} disabled={!addBagId}>
                Add bag
              </Button>
            </TabsContent>

            <TabsContent value="oneoff" className="pt-4">
              <form className="flex flex-col gap-3" onSubmit={handleAddAdHoc}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="adhoc-name">Add a one-off item</Label>
                  <Input
                    ref={adhocInputRef}
                    id="adhoc-name"
                    value={adhocName}
                    onChange={(event) => setAdhocName(event.target.value)}
                    placeholder="e.g. Travel adapter"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="w-24">
                    <Label htmlFor="adhoc-qty">Qty</Label>
                    <Input
                      id="adhoc-qty"
                      type="number"
                      min={1}
                      step={1}
                      value={adhocQty}
                      onChange={(event) => setAdhocQty(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="adhoc-destination">Destination</Label>
                    <select
                      id="adhoc-destination"
                      className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                      value={adhocDestination}
                      onChange={(event) => setAdhocDestination(event.target.value)}
                      aria-label="Destination for one-off item"
                    >
                      <option value="loose">Loose</option>
                      <option value="with_me">With Me</option>
                      {bags.map((bag) => (
                        <option key={bag.id} value={`bag:${bag.id}`}>
                          {bag.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit">Add</Button>
              </form>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailEntry !== null} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <DialogContent>
          <form onSubmit={handleSaveDetails}>
            <DialogHeader>
              <DialogTitle>Item details</DialogTitle>
              <DialogDescription>
                Details are copied onto this trip and do not change your library.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detail-category">Category</Label>
                <select
                  id="detail-category"
                  className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                  value={detailCategory}
                  onChange={(event) => setDetailCategory(event.target.value as ItemCategory | "")}
                >
                  <option value="">Uncategorised</option>
                  {ITEM_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.categories.map((value) => (
                        <option key={value} value={value}>
                          {ITEM_CATEGORY_LABELS[value]}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detail-description">Description</Label>
                <Textarea
                  id="detail-description"
                  value={detailDescription}
                  onChange={(event) => setDetailDescription(event.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detail-link">Link</Label>
                <Input
                  id="detail-link"
                  inputMode="url"
                  value={detailLink}
                  onChange={(event) => setDetailLink(event.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detail-image">Image URL</Label>
                <Input
                  id="detail-image"
                  inputMode="url"
                  value={detailImageUrl}
                  onChange={(event) => setDetailImageUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDetailEntry(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingDetails}>
                {savingDetails ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this trip</DialogTitle>
            <DialogDescription>
              Anyone with the link can view this packing list read-only. They cannot change it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {shareLink ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="share-url">Link</Label>
                <Input id="share-url" readOnly value={shareUrl} />
              </div>
            ) : shareBusy ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
              <p className="text-sm text-muted-foreground">
                No link yet. Create one to share this list.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-expiry">Expires</Label>
              <select
                id="share-expiry"
                className="h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem]"
                value={shareExpiry}
                onChange={(event) => setShareExpiry(event.target.value as ShareExpiry)}
              >
                {SHARE_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShareOpen(false)}>
              Done
            </Button>
            {shareLink ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRegenerateShare()}
                  disabled={shareBusy}
                >
                  Regenerate
                </Button>
                <Button type="button" onClick={() => void handleCopyShare()}>
                  Copy link
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => void handleCreateShare()} disabled={shareBusy}>
                Create link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportPdfDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        buildModel={(mode) => buildTripPdfViewModel({ trip, bags, entries, mode, unit })}
      />
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
      <TripView />
    </Suspense>
  );
}
