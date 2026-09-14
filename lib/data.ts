import { supabase } from "./supabase";
import { getFirebaseAuth } from "./firebase";
import type {
  ReusableBag,
  ReusableBagItem,
  ReusableItem,
  Trip,
  TripBag,
  TripEntry,
  UserProfile,
} from "./types";
import {
  validateBirthday,
  validateDateRange,
  validateGender,
  validateName,
  validateOptionalName,
  validateQty,
} from "./validation";

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("No data returned");
  return data;
}

// ---------------------------------------------------------------------------
// Reusable items
// ---------------------------------------------------------------------------

export async function listItems(): Promise<ReusableItem[]> {
  const { data, error } = await supabase
    .from("reusable_items")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReusableItem[];
}

export async function createItem(input: {
  name: string;
  defaultQty: number;
}): Promise<ReusableItem> {
  const name = validateName(input.name, "Item name");
  const defaultQty = validateQty(input.defaultQty, "Default quantity");
  const { data, error } = await supabase
    .from("reusable_items")
    .insert({ name, default_qty: defaultQty })
    .select()
    .single();
  return unwrap(data as ReusableItem | null, error);
}

export async function updateItem(
  id: string,
  input: { name: string; defaultQty: number },
): Promise<ReusableItem> {
  const name = validateName(input.name, "Item name");
  const defaultQty = validateQty(input.defaultQty, "Default quantity");
  const { data, error } = await supabase
    .from("reusable_items")
    .update({ name, default_qty: defaultQty })
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as ReusableItem | null, error);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("reusable_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Reusable bags and their default contents
// ---------------------------------------------------------------------------

export async function listBags(): Promise<ReusableBag[]> {
  const { data, error } = await supabase
    .from("reusable_bags")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReusableBag[];
}

export async function createBag(input: { name: string }): Promise<ReusableBag> {
  const name = validateName(input.name, "Bag name");
  const { data, error } = await supabase.from("reusable_bags").insert({ name }).select().single();
  return unwrap(data as ReusableBag | null, error);
}

export async function updateBag(id: string, input: { name: string }): Promise<ReusableBag> {
  const name = validateName(input.name, "Bag name");
  const { data, error } = await supabase
    .from("reusable_bags")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as ReusableBag | null, error);
}

export async function deleteBag(id: string): Promise<void> {
  const { error } = await supabase.from("reusable_bags").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listBagContents(bagId: string): Promise<ReusableBagItem[]> {
  const { data, error } = await supabase
    .from("reusable_bag_items")
    .select("*")
    .eq("bag_id", bagId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReusableBagItem[];
}

export async function addBagItem(
  bagId: string,
  itemId: string,
  qty: number,
): Promise<ReusableBagItem> {
  const validQty = validateQty(qty);
  const existing = await listBagContents(bagId);
  const nextPosition =
    existing.length === 0 ? 0 : Math.max(...existing.map((row) => row.position)) + 1;
  const { data, error } = await supabase
    .from("reusable_bag_items")
    .insert({ bag_id: bagId, item_id: itemId, qty: validQty, position: nextPosition })
    .select()
    .single();
  return unwrap(data as ReusableBagItem | null, error);
}

export async function removeBagItem(bagItemId: string): Promise<void> {
  const { error } = await supabase.from("reusable_bag_items").delete().eq("id", bagItemId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Trip[];
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  return unwrap(data as Trip | null, error);
}

export async function createTrip(input: {
  name: string;
  startDate: string | null;
  endDate: string | null;
}): Promise<Trip> {
  const name = validateName(input.name, "Trip name");
  const { startDate, endDate } = validateDateRange(input.startDate, input.endDate);
  const { data, error } = await supabase
    .from("trips")
    .insert({ name, start_date: startDate, end_date: endDate })
    .select()
    .single();
  return unwrap(data as Trip | null, error);
}

export async function updateTrip(
  id: string,
  input: { name: string; startDate: string | null; endDate: string | null },
): Promise<Trip> {
  const name = validateName(input.name, "Trip name");
  const { startDate, endDate } = validateDateRange(input.startDate, input.endDate);
  const { data, error } = await supabase
    .from("trips")
    .update({ name, start_date: startDate, end_date: endDate })
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as Trip | null, error);
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Packing list (trip-scoped bags and entries)
// ---------------------------------------------------------------------------

export async function listTripBags(tripId: string): Promise<TripBag[]> {
  const { data, error } = await supabase
    .from("trip_bags")
    .select("*")
    .eq("trip_id", tripId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TripBag[];
}

export async function listTripEntries(tripId: string): Promise<TripEntry[]> {
  const { data, error } = await supabase
    .from("trip_entries")
    .select("*")
    .eq("trip_id", tripId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TripEntry[];
}

export async function addLibraryBagToTrip(tripId: string, bagId: string): Promise<void> {
  const { error } = await supabase.rpc("add_library_bag_to_trip", {
    p_trip_id: tripId,
    p_bag_id: bagId,
  });
  if (error) throw new Error(error.message);
}

export async function addLibraryItemToTrip(
  tripId: string,
  itemId: string,
  tripBagId: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("add_library_item_to_trip", {
    p_trip_id: tripId,
    p_item_id: itemId,
    p_trip_bag_id: tripBagId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function addAdHocEntry(input: {
  tripId: string;
  name: string;
  qty: number;
  tripBagId: string | null;
}): Promise<TripEntry> {
  const name = validateName(input.name, "Item name");
  const qty = validateQty(input.qty);
  const entries = await listTripEntries(input.tripId);
  const nextPosition = entries.length === 0 ? 0 : Math.max(...entries.map((e) => e.position)) + 1;
  const { data, error } = await supabase
    .from("trip_entries")
    .insert({
      trip_id: input.tripId,
      trip_bag_id: input.tripBagId,
      name,
      qty,
      position: nextPosition,
    })
    .select()
    .single();
  return unwrap(data as TripEntry | null, error);
}

export async function updateEntry(
  id: string,
  patch: Partial<
    Pick<TripEntry, "name" | "qty" | "trip_bag_id" | "is_with_me" | "is_packed" | "position">
  >,
): Promise<TripEntry> {
  const clean: typeof patch = { ...patch };
  if (clean.name !== undefined) clean.name = validateName(clean.name, "Item name");
  if (clean.qty !== undefined) clean.qty = validateQty(clean.qty);
  const { data, error } = await supabase
    .from("trip_entries")
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as TripEntry | null, error);
}

export async function setEntryLocation(
  entry: TripEntry,
  location: { kind: "bag"; bagId: string } | { kind: "with_me" } | { kind: "loose" },
): Promise<TripEntry> {
  if (location.kind === "bag") {
    return updateEntry(entry.id, { trip_bag_id: location.bagId, is_with_me: false });
  }
  if (location.kind === "with_me") {
    return updateEntry(entry.id, { trip_bag_id: null, is_with_me: true });
  }
  return updateEntry(entry.id, { trip_bag_id: null, is_with_me: false });
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from("trip_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderEntries(ordered: TripEntry[]): Promise<void> {
  await Promise.all(
    ordered.map((entry, index) =>
      supabase.from("trip_entries").update({ position: index }).eq("id", entry.id),
    ),
  );
}

export async function reorderTripBags(ordered: TripBag[]): Promise<void> {
  await Promise.all(
    ordered.map((bag, index) =>
      supabase.from("trip_bags").update({ position: index }).eq("id", bag.id),
    ),
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function getProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as UserProfile | null) ?? null;
}

export async function upsertProfile(input: {
  displayName: string | null;
  birthday: string | null;
  gender: string | null;
}): Promise<UserProfile> {
  const displayName = validateOptionalName(input.displayName);
  const birthday = validateBirthday(input.birthday);
  const gender = validateGender(input.gender);
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to update your profile");
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: uid,
        display_name: displayName,
        birthday,
        gender,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  return unwrap(data as UserProfile | null, error);
}

// ---------------------------------------------------------------------------
// Account data: export and deletion
// ---------------------------------------------------------------------------

export type ExportedData = {
  profile: UserProfile | null;
  reusable_items: ReusableItem[];
  reusable_bags: ReusableBag[];
  reusable_bag_items: ReusableBagItem[];
  trips: Trip[];
  trip_bags: TripBag[];
  trip_entries: TripEntry[];
};

export async function listAllBagItems(): Promise<ReusableBagItem[]> {
  const { data, error } = await supabase.from("reusable_bag_items").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as ReusableBagItem[];
}

export async function listAllTripBags(): Promise<TripBag[]> {
  const { data, error } = await supabase.from("trip_bags").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as TripBag[];
}

export async function listAllTripEntries(): Promise<TripEntry[]> {
  const { data, error } = await supabase.from("trip_entries").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as TripEntry[];
}

export async function collectUserData(): Promise<ExportedData> {
  const [profile, items, bags, bagItems, trips, tripBags, tripEntries] = await Promise.all([
    getProfile(),
    listItems(),
    listBags(),
    listAllBagItems(),
    listTrips(),
    listAllTripBags(),
    listAllTripEntries(),
  ]);

  return {
    profile,
    reusable_items: items,
    reusable_bags: bags,
    reusable_bag_items: bagItems,
    trips,
    trip_bags: tripBags,
    trip_entries: tripEntries,
  };
}

export async function deleteAllUserData(): Promise<void> {
  // Deleting trips cascades to trip_bags and trip_entries; deleting reusable
  // bags and items cascades to reusable_bag_items.
  const { error: tripsError } = await supabase.from("trips").delete().neq("id", "");
  if (tripsError) throw new Error(tripsError.message);
  const { error: bagsError } = await supabase.from("reusable_bags").delete().neq("id", "");
  if (bagsError) throw new Error(bagsError.message);
  const { error: itemsError } = await supabase.from("reusable_items").delete().neq("id", "");
  if (itemsError) throw new Error(itemsError.message);
  const { error: profileError } = await supabase.from("profiles").delete().neq("user_id", "");
  if (profileError) throw new Error(profileError.message);
}
