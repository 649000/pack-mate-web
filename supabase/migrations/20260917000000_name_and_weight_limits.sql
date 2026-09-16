-- Name length and weight ceiling constraints
-- Schema: packmate
-- Mirrors the application limits in lib/validation.ts (MAX_NAME_LENGTH = 200,
-- MAX_WEIGHT_GRAMS = 100000) so a write that bypasses the app cannot exceed
-- them. The database is the integrity boundary, not the client.

-- Names: 1..200 characters after trimming. Replaces the blank-only check.
alter table packmate.reusable_items
  drop constraint reusable_items_name_not_blank,
  add constraint reusable_items_name_length check (length(btrim(name)) between 1 and 200);

alter table packmate.reusable_bags
  drop constraint reusable_bags_name_not_blank,
  add constraint reusable_bags_name_length check (length(btrim(name)) between 1 and 200);

alter table packmate.trips
  drop constraint trips_name_not_blank,
  add constraint trips_name_length check (length(btrim(name)) between 1 and 200);

alter table packmate.trip_bags
  drop constraint trip_bags_name_not_blank,
  add constraint trip_bags_name_length check (length(btrim(name)) between 1 and 200);

alter table packmate.trip_entries
  drop constraint trip_entries_name_not_blank,
  add constraint trip_entries_name_length check (length(btrim(name)) between 1 and 200);

-- Weights: 0..100000 grams inclusive. Replaces the non-negative-only checks.
alter table packmate.reusable_items
  drop constraint reusable_items_weight_non_negative,
  add constraint reusable_items_weight_range check (
    weight_grams is null or (weight_grams >= 0 and weight_grams <= 100000)
  );

alter table packmate.trip_entries
  drop constraint trip_entries_weight_non_negative,
  add constraint trip_entries_weight_range check (
    weight_grams is null or (weight_grams >= 0 and weight_grams <= 100000)
  );

alter table packmate.reusable_bags
  drop constraint reusable_bags_weight_limit_non_negative,
  add constraint reusable_bags_weight_limit_range check (
    weight_limit_grams is null or (weight_limit_grams >= 0 and weight_limit_grams <= 100000)
  );

alter table packmate.trip_bags
  drop constraint trip_bags_weight_limit_non_negative,
  add constraint trip_bags_weight_limit_range check (
    weight_limit_grams is null or (weight_limit_grams >= 0 and weight_limit_grams <= 100000)
  );
