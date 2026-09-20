-- Duplicate a trip
-- Schema: packmate
-- Copies a trip's packing list into a new trip. The new trip's trip-level
-- fields are supplied by the caller; the packing list is copied row by row,
-- preserving bag nesting and entry metadata while resetting packed state.
-- Share links and packed state are never copied. Runs as the caller
-- (security invoker) so RLS still applies, and verifies the caller owns the
-- source trip.

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
    insert into trip_bags (trip_id, name, source_bag_id, position, weight_limit_grams)
    values (
      v_new_trip_id,
      v_bag.name,
      v_bag.source_bag_id,
      v_bag.position,
      v_bag.weight_limit_grams
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

revoke all on function packmate.duplicate_trip(uuid, text, text, text, date, date) from public;
grant execute on function packmate.duplicate_trip(uuid, text, text, text, date, date) to authenticated;
