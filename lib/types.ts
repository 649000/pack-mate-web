export type ItemCategory =
  | "documents"
  | "valuables"
  | "health"
  | "clothing"
  | "footwear"
  | "swim_beach"
  | "formal"
  | "toiletries"
  | "comfort"
  | "electronics"
  | "work_study"
  | "entertainment"
  | "sports"
  | "gear"
  | "food"
  | "laundry"
  | "baby_kids"
  | "pets"
  | "religious"
  | "accessibility";

export type ReusableItem = {
  id: string;
  user_id: string;
  name: string;
  default_qty: number;
  description: string | null;
  link: string | null;
  image_url: string | null;
  weight_grams: number | null;
  category: ItemCategory | null;
  created_at: string;
};

export type ReusableBag = {
  id: string;
  user_id: string;
  name: string;
  weight_limit_grams: number | null;
  created_at: string;
};

export type ReusableBagItem = {
  id: string;
  bag_id: string;
  item_id: string;
  qty: number;
  position: number;
};

export type Trip = {
  id: string;
  user_id: string;
  name: string;
  destination: string | null;
  country_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

// Read-only reference data keyed by ISO 3166-1 alpha-2 country code. Any field
// may be absent when the sources have no value for that country.
export type DestinationFacts = {
  country_code: string;
  currency_code: string | null;
  calling_code: string | null;
  plug_types: string[];
  voltage: string | null;
  frequency: string | null;
  timezones: string[];
  updated_at: string;
};

export type TripBag = {
  id: string;
  trip_id: string;
  name: string;
  source_bag_id: string | null;
  position: number;
  weight_limit_grams: number | null;
  parent_bag_id: string | null;
};

export type TripEntry = {
  id: string;
  trip_id: string;
  trip_bag_id: string | null;
  name: string;
  qty: number;
  source_item_id: string | null;
  is_with_me: boolean;
  is_packed: boolean;
  position: number;
  description: string | null;
  link: string | null;
  image_url: string | null;
  weight_grams: number | null;
  category: ItemCategory | null;
};

export type TripEntryLocation =
  { kind: "bag"; bagId: string } | { kind: "with_me" } | { kind: "loose" };

// Minimal shapes the packing and weight helpers need. TripBag and TripEntry
// satisfy these, and so do the public shared-view payloads, which omit owner
// and library identifiers.
export type BagLike = Pick<
  TripBag,
  "id" | "name" | "parent_bag_id" | "position" | "weight_limit_grams"
>;

export type EntryLike = Pick<
  TripEntry,
  | "id"
  | "trip_bag_id"
  | "is_with_me"
  | "is_packed"
  | "name"
  | "qty"
  | "position"
  | "weight_grams"
  | "category"
>;

export type ShareLink = {
  id: string;
  trip_id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type SharedTripBag = BagLike;

export type SharedTripEntry = EntryLike & {
  description: string | null;
  link: string | null;
  image_url: string | null;
};

export type SharedTrip = {
  v: number;
  trip: {
    name: string;
    destination: string | null;
    country_code: string;
    start_date: string | null;
    end_date: string | null;
  };
  bags: SharedTripBag[];
  entries: SharedTripEntry[];
};

export type Gender = "female" | "male" | "other" | "prefer_not_to_say";

export type DisplayWeightUnit = "kg" | "lb";

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  birthday: string | null;
  gender: Gender | null;
  weight_unit: DisplayWeightUnit;
  created_at: string;
  updated_at: string;
};
