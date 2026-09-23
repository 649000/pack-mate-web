-- Bag identity: an optional, user-chosen icon for a bag.
-- Schema: packmate
-- A bag may carry one of a fixed set of icon keys so the user can identify it
-- at a glance. The key set is mirrored in lib/bag-icons.ts; lib/bag-icons.test.ts
-- asserts the two stay in sync. The icon is copied onto a trip bag when the
-- library bag is added, and when a trip is duplicated.

alter table packmate.reusable_bags
  add column icon text,
  add constraint reusable_bags_icon_valid check (
    icon is null or icon in (
      'backpack', 'suitcase', 'duffel', 'daypack', 'tote', 'briefcase', 'camera',
      'electronics', 'toiletry', 'medical', 'clothing', 'footwear', 'documents',
      'valuables', 'sports', 'beach', 'food', 'baby', 'pet', 'laundry', 'other'
    )
  );

alter table packmate.trip_bags
  add column icon text,
  add constraint trip_bags_icon_valid check (
    icon is null or icon in (
      'backpack', 'suitcase', 'duffel', 'daypack', 'tote', 'briefcase', 'camera',
      'electronics', 'toiletry', 'medical', 'clothing', 'footwear', 'documents',
      'valuables', 'sports', 'beach', 'food', 'baby', 'pet', 'laundry', 'other'
    )
  );

-- ===========================================================================
-- Copy-on-add carries the icon
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

  insert into trip_bags (trip_id, name, source_bag_id, position, weight_limit_grams, icon)
  values (p_trip_id, v_bag.name, p_bag_id, v_next_pos, v_bag.weight_limit_grams, v_bag.icon)
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

-- ===========================================================================
-- Trip duplication carries the icon
-- ===========================================================================

create or replace function packmate.duplicate_trip(
  p_source_trip_id uuid,
  p_name text,
  p_country_code text,
  p_destination text,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_uid text := (auth.jwt() ->> 'sub');
  v_new_trip_id uuid;
  v_bag record;
  v_new_bag_id uuid;
  v_bag_map jsonb := '{}'::jsonb;
begin
  if not exists (
    select 1 from trips t where t.id = p_source_trip_id and t.user_id = v_uid
  ) then
    raise exception 'trip not found' using errcode = '42501';
  end if;

  insert into trips (name, country_code, destination, start_date, end_date)
  values (p_name, p_country_code, p_destination, p_start_date, p_end_date)
  returning id into v_new_trip_id;

  -- First pass: copy bags without parents, recording old-id -> new-id.
  for v_bag in
    select * from trip_bags
    where trip_id = p_source_trip_id
    order by position, name
  loop
    insert into trip_bags (trip_id, name, source_bag_id, position, weight_limit_grams, icon)
    values (
      v_new_trip_id,
      v_bag.name,
      v_bag.source_bag_id,
      v_bag.position,
      v_bag.weight_limit_grams,
      v_bag.icon
    )
    returning id into v_new_bag_id;

    v_bag_map := v_bag_map || jsonb_build_object(v_bag.id::text, v_new_bag_id::text);
  end loop;

  -- Second pass: restore nesting using the recorded mapping.
  for v_bag in
    select * from trip_bags
    where trip_id = p_source_trip_id and parent_bag_id is not null
  loop
    update trip_bags
    set parent_bag_id = (v_bag_map ->> v_bag.parent_bag_id::text)::uuid
    where id = (v_bag_map ->> v_bag.id::text)::uuid;
  end loop;

  -- Entries are copied with their metadata and location, but never packed.
  insert into trip_entries (
    trip_id,
    trip_bag_id,
    name,
    qty,
    source_item_id,
    is_with_me,
    is_packed,
    position,
    description,
    link,
    image_url,
    weight_grams,
    category
  )
  select
    v_new_trip_id,
    case
      when e.trip_bag_id is null then null
      else (v_bag_map ->> e.trip_bag_id::text)::uuid
    end,
    e.name,
    e.qty,
    e.source_item_id,
    e.is_with_me,
    false,
    e.position,
    e.description,
    e.link,
    e.image_url,
    e.weight_grams,
    e.category
  from trip_entries e
  where e.trip_id = p_source_trip_id;

  return v_new_trip_id;
end;
$$;
