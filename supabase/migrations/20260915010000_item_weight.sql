-- Item weight and bag weight limits
-- Schema: packmate
-- Weight is stored canonically in grams; display units (kg/lb) are a client
-- concern. Bag limits are copied onto trip bags by the copy-on-add functions
-- below.

alter table packmate.reusable_items
  add column weight_grams numeric,
  add constraint reusable_items_weight_non_negative check (
    weight_grams is null or weight_grams >= 0
  );

alter table packmate.trip_entries
  add column weight_grams numeric,
  add constraint trip_entries_weight_non_negative check (
    weight_grams is null or weight_grams >= 0
  );

alter table packmate.reusable_bags
  add column weight_limit_grams numeric,
  add constraint reusable_bags_weight_limit_non_negative check (
    weight_limit_grams is null or weight_limit_grams >= 0
  );

alter table packmate.trip_bags
  add column weight_limit_grams numeric,
  add constraint trip_bags_weight_limit_non_negative check (
    weight_limit_grams is null or weight_limit_grams >= 0
  );

alter table packmate.profiles
  add column weight_unit text not null default 'kg',
  add constraint profiles_weight_unit_valid check (weight_unit in ('kg', 'lb'));

-- ===========================================================================
-- Copy-on-add (updated to carry weight and bag limits)
-- ===========================================================================

create or replace function packmate.add_library_bag_to_trip(
  p_trip_id uuid,
  p_bag_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_uid text := (auth.jwt() ->> 'sub');
  v_bag record;
  v_trip_bag_id uuid;
  v_next_pos integer;
begin
  if not exists (
    select 1 from trips t where t.id = p_trip_id and t.user_id = v_uid
  ) then
    raise exception 'trip not found' using errcode = '42501';
  end if;

  select * into v_bag
  from reusable_bags b
  where b.id = p_bag_id and b.user_id = v_uid;

  if not found then
    raise exception 'bag not found' using errcode = '42501';
  end if;

  select coalesce(max(position), -1) + 1 into v_next_pos
  from trip_bags
  where trip_id = p_trip_id;

  insert into trip_bags (trip_id, name, source_bag_id, position, weight_limit_grams)
  values (p_trip_id, v_bag.name, p_bag_id, v_next_pos, v_bag.weight_limit_grams)
  returning id into v_trip_bag_id;

  insert into trip_entries (
    trip_id, trip_bag_id, name, qty, source_item_id, position,
    description, link, image_url, weight_grams
  )
  select
    p_trip_id,
    v_trip_bag_id,
    i.name,
    bi.qty,
    i.id,
    (row_number() over (order by bi.position, i.name) - 1)::integer,
    i.description,
    i.link,
    i.image_url,
    i.weight_grams
  from reusable_bag_items bi
  join reusable_items i on i.id = bi.item_id
  where bi.bag_id = p_bag_id;

  return v_trip_bag_id;
end;
$$;

create or replace function packmate.add_library_item_to_trip(
  p_trip_id uuid,
  p_item_id uuid,
  p_trip_bag_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_uid text := (auth.jwt() ->> 'sub');
  v_item record;
  v_next_pos integer;
  v_entry_id uuid;
begin
  if not exists (
    select 1 from trips t where t.id = p_trip_id and t.user_id = v_uid
  ) then
    raise exception 'trip not found' using errcode = '42501';
  end if;

  select * into v_item
  from reusable_items i
  where i.id = p_item_id and i.user_id = v_uid;

  if not found then
    raise exception 'item not found' using errcode = '42501';
  end if;

  if p_trip_bag_id is not null and not exists (
    select 1 from trip_bags b
    where b.id = p_trip_bag_id and b.trip_id = p_trip_id
  ) then
    raise exception 'bag not found in trip' using errcode = '42501';
  end if;

  select coalesce(max(position), -1) + 1 into v_next_pos
  from trip_entries
  where trip_id = p_trip_id;

  insert into trip_entries (
    trip_id, trip_bag_id, name, qty, source_item_id, position,
    description, link, image_url, weight_grams
  )
  values (
    p_trip_id, p_trip_bag_id, v_item.name, v_item.default_qty, p_item_id, v_next_pos,
    v_item.description, v_item.link, v_item.image_url, v_item.weight_grams
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;
