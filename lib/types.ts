export type ReusableItem = {
  id: string;
  user_id: string;
  name: string;
  default_qty: number;
  created_at: string;
};

export type ReusableBag = {
  id: string;
  user_id: string;
  name: string;
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
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type TripBag = {
  id: string;
  trip_id: string;
  name: string;
  source_bag_id: string | null;
  position: number;
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
};

export type TripEntryLocation =
  { kind: "bag"; bagId: string } | { kind: "with_me" } | { kind: "loose" };

export type Gender = "female" | "male" | "other" | "prefer_not_to_say";

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  birthday: string | null;
  gender: Gender | null;
  created_at: string;
  updated_at: string;
};
