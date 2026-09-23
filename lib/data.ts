import { supabase } from "./supabase";
import { getFirebaseAuth } from "./firebase";
import type { BagIcon } from "./bag-icons";
import type {
  ItemCategory,
  DestinationFacts,
  ProfileTheme,
  ReusableBag,
  ReusableBagItem,
  ReusableItem,
  ShareLink,
  SharedTrip,
  Trip,
  TripBag,
  TripEntry,
  UserProfile,
} from "./types";
import {
  validateBagIcon,
  validateBirthday,
  validateCategory,
  validateCountry,
  validateDateRange,
  validateGender,
  validateName,
  validateOptionalDescription,
  validateOptionalDestination,
  validateOptionalName,
  validateOptionalUrl,
  validateQty,
  validateTheme,
  validateWeight,
  validateWeightLimit,
  validateWeightUnit,
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

export type ItemDetails = {
  description: string | null;
  link: string | null;
  imageUrl: string | null;
  weightGrams: number | null;
  category: ItemCategory | null;
};

function validateItemDetails(input: {
  description?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  weightGrams?: number | null;
  category?: string | null;
}): {
  description: string | null;
  link: string | null;
  image_url: string | null;
  weight_grams: number | null;
  category: ItemCategory | null;
} {
  return {
    description: validateOptionalDescription(input.description),
    link: validateOptionalUrl(input.link, "Link"),
    image_url: validateOptionalUrl(input.imageUrl, "Image URL"),
    weight_grams: validateWeight(input.weightGrams),
    category: validateCategory(input.category),
  };
}

export async function createItem(
  input: { name: string; defaultQty: number } & Partial<ItemDetails>,
): Promise<ReusableItem> {
  const name = validateName(input.name, "Item name");
  const defaultQty = validateQty(input.defaultQty, "Default quantity");
  const details = validateItemDetails(input);
  const { data, error } = await supabase
    .from("reusable_items")
    .insert({ name, default_qty: defaultQty, ...details })
    .select()
    .single();
  return unwrap(data as ReusableItem | null, error);
}

export async function updateItem(
  id: string,
  input: { name: string; defaultQty: number } & Partial<ItemDetails>,
): Promise<ReusableItem> {
  const name = validateName(input.name, "Item name");
  const defaultQty = validateQty(input.defaultQty, "Default quantity");
  const details = validateItemDetails(input);
  const { data, error } = await supabase
    .from("reusable_items")
    .update({ name, default_qty: defaultQty, ...details })
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

export async function createBag(input: {
  name: string;
  weightLimitGrams?: number | null;
  icon?: BagIcon | null;
}): Promise<ReusableBag> {
  const name = validateName(input.name, "Bag name");
  const weight_limit_grams = validateWeightLimit(input.weightLimitGrams);
  const icon = validateBagIcon(input.icon);
  const { data, error } = await supabase
    .from("reusable_bags")
    .insert({ name, weight_limit_grams, icon })
    .select()
    .single();
  return unwrap(data as ReusableBag | null, error);
}

export async function updateBag(
  id: string,
  input: { name: string; weightLimitGrams?: number | null; icon?: BagIcon | null },
): Promise<ReusableBag> {
  const name = validateName(input.name, "Bag name");
  const weight_limit_grams = validateWeightLimit(input.weightLimitGrams);
  const icon = validateBagIcon(input.icon);
  const { data, error } = await supabase
    .from("reusable_bags")
    .update({ name, weight_limit_grams, icon })
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as ReusableBag | null, error);
}

export async function deleteBag(id: string): Promise<void> {
  const { error } = await supabase.from("reusable_bags").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Duplicates a library bag, copying its icon, weight limit and default
// contents. The database function copies the bag and its contents atomically
// and verifies ownership; the source is never modified.
export async function duplicateBag(sourceBagId: string): Promise<ReusableBag> {
  const { data, error } = await supabase.rpc("duplicate_bag", { p_bag_id: sourceBagId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No data returned");
  const { data: bag, error: bagError } = await supabase
    .from("reusable_bags")
    .select("*")
    .eq("id", data as string)
    .single();
  return unwrap(bag as ReusableBag | null, bagError);
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

export type TripInput = {
  name: string;
  destination: string | null;
  countryCode: string;
  startDate: string | null;
  endDate: string | null;
};

function validateTrip(input: TripInput) {
  const name = validateName(input.name, "Trip name");
  const destination = validateOptionalDestination(input.destination);
  const country_code = validateCountry(input.countryCode);
  const { startDate, endDate } = validateDateRange(input.startDate, input.endDate);
  return { name, destination, country_code, start_date: startDate, end_date: endDate };
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .insert(validateTrip(input))
    .select()
    .single();
  return unwrap(data as Trip | null, error);
}

export async function updateTrip(id: string, input: TripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .update(validateTrip(input))
    .eq("id", id)
    .select()
    .single();
  return unwrap(data as Trip | null, error);
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Creates a new trip from the given fields and copies the source trip's
// packing list into it. The source is verified server-side, and the whole copy
// runs in one transaction.
export async function duplicateTrip(sourceTripId: string, input: TripInput): Promise<Trip> {
  const { name, destination, country_code, start_date, end_date } = validateTrip(input);
  const { data, error } = await supabase.rpc("duplicate_trip", {
    p_source_trip_id: sourceTripId,
    p_name: name,
    p_country_code: country_code,
    p_destination: destination,
    p_start_date: start_date,
    p_end_date: end_date,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No data returned");
  return getTrip(data as string);
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
    Pick<
      TripEntry,
      | "name"
      | "qty"
      | "trip_bag_id"
      | "is_with_me"
      | "is_packed"
      | "position"
      | "description"
      | "link"
      | "image_url"
      | "weight_grams"
      | "category"
    >
  >,
): Promise<TripEntry> {
  const clean: typeof patch = { ...patch };
  if (clean.name !== undefined) clean.name = validateName(clean.name, "Item name");
  if (clean.qty !== undefined) clean.qty = validateQty(clean.qty);
  if (clean.description !== undefined) {
    clean.description = validateOptionalDescription(clean.description);
  }
  if (clean.link !== undefined) clean.link = validateOptionalUrl(clean.link, "Link");
  if (clean.image_url !== undefined) {
    clean.image_url = validateOptionalUrl(clean.image_url, "Image URL");
  }
  if (clean.weight_grams !== undefined) {
    clean.weight_grams = validateWeight(clean.weight_grams);
  }
  if (clean.category !== undefined) {
    clean.category = validateCategory(clean.category);
  }
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

// Marks every entry on a trip packed or unpacked in one action. The trip is
// verified server-side and only packed state changes.
export async function setTripPacked(tripId: string, packed: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_trip_packed", {
    p_trip_id: tripId,
    p_packed: packed,
  });
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

export async function setBagParent(bag: TripBag, parent: TripBag | null): Promise<TripBag> {
  if (parent && parent.trip_id !== bag.trip_id) {
    throw new Error("A bag can only be nested inside a bag from the same trip");
  }
  const { data, error } = await supabase
    .from("trip_bags")
    .update({ parent_bag_id: parent?.id ?? null })
    .eq("id", bag.id)
    .select()
    .single();
  return unwrap(data as TripBag | null, error);
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export async function listShareLinks(): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShareLink[];
}

function isLinkExpired(link: ShareLink): boolean {
  return link.expires_at !== null && new Date(link.expires_at).getTime() <= Date.now();
}

export async function getActiveShareLink(tripId: string): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("trip_id", tripId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ShareLink | null) ?? null;
}

// A trip has at most one active link. Reuse it while it is still valid;
// otherwise revoke the stale one and mint a new token, so an expired URL can
// never be resurrected.
export async function createShareLink(
  tripId: string,
  expiresAt: string | null = null,
): Promise<ShareLink> {
  const existing = await getActiveShareLink(tripId);

  if (existing) {
    if (!isLinkExpired(existing)) return existing;
    await revokeShareLink(existing.id);
  }

  const { data, error } = await supabase
    .from("share_links")
    .insert({ trip_id: tripId, expires_at: expiresAt })
    .select()
    .single();
  return unwrap(data as ShareLink | null, error);
}

export async function revokeShareLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function regenerateShareLink(
  id: string,
  options: { expiresAt?: string | null } = {},
): Promise<ShareLink> {
  const { data: current, error: currentError } = await supabase
    .from("share_links")
    .select("*")
    .eq("id", id)
    .single();
  const link = unwrap(current as ShareLink | null, currentError);
  const expiresAt = "expiresAt" in options ? (options.expiresAt ?? null) : link.expires_at;
  await revokeShareLink(link.id);
  const { data, error } = await supabase
    .from("share_links")
    .insert({ trip_id: link.trip_id, expires_at: expiresAt })
    .select()
    .single();
  return unwrap(data as ShareLink | null, error);
}

export async function getSharedTrip(token: string): Promise<SharedTrip | null> {
  const { data, error } = await supabase.rpc("get_shared_trip", { p_token: token });
  if (error) throw new Error(error.message);
  return (data as SharedTrip | null) ?? null;
}

// ---------------------------------------------------------------------------
// Destination facts
// ---------------------------------------------------------------------------

export async function getDestinationFacts(countryCode: string): Promise<DestinationFacts | null> {
  const { data, error } = await supabase
    .from("destination_facts")
    .select("*")
    .eq("country_code", countryCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as DestinationFacts | null) ?? null;
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
  weightUnit?: string | null;
}): Promise<UserProfile> {
  const displayName = validateOptionalName(input.displayName);
  const birthday = validateBirthday(input.birthday);
  const gender = validateGender(input.gender);
  const weight_unit = validateWeightUnit(input.weightUnit);
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
        weight_unit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  return unwrap(data as UserProfile | null, error);
}

// Persists the theme on the profile without touching the other profile fields:
// a targeted upsert writes only the theme (and updated_at).
export async function updateProfileTheme(theme: ProfileTheme): Promise<void> {
  const value = validateTheme(theme);
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to change your theme");
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: uid, theme: value, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
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
  share_links: ShareLink[];
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
  const [profile, items, bags, bagItems, trips, tripBags, tripEntries, shareLinks] =
    await Promise.all([
      getProfile(),
      listItems(),
      listBags(),
      listAllBagItems(),
      listTrips(),
      listAllTripBags(),
      listAllTripEntries(),
      listShareLinks(),
    ]);

  return {
    profile,
    reusable_items: items,
    reusable_bags: bags,
    reusable_bag_items: bagItems,
    trips,
    trip_bags: tripBags,
    trip_entries: tripEntries,
    share_links: shareLinks,
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

// ---------------------------------------------------------------------------
// Packing suggestions
// ---------------------------------------------------------------------------

export async function listSuggestionDismissals(tripId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("suggestion_dismissals")
    .select("suggestion_key")
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => (row as { suggestion_key: string }).suggestion_key);
}

export async function dismissSuggestion(input: {
  tripId: string;
  key: string;
  source: string;
}): Promise<void> {
  const { error } = await supabase
    .from("suggestion_dismissals")
    .upsert(
      { trip_id: input.tripId, suggestion_key: input.key, source: input.source },
      { onConflict: "user_id,trip_id,suggestion_key" },
    );
  if (error) throw new Error(error.message);
}
