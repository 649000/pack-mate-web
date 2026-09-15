-- Item categories
-- Schema: packmate
-- Optional, fixed-set category for reusable items. The copy-on-add functions
-- carry it onto trip entries, and get_shared_trip exposes it in the public
-- projection. `null` means uncategorised; there is no explicit "other" value.

alter table packmate.reusable_items
  add column category text,
  add constraint reusable_items_category_valid check (
    category is null or category in (
      'documents', 'valuables', 'health',
      'clothing', 'footwear', 'swim_beach', 'formal',
      'toiletries', 'comfort',
      'electronics', 'work_study', 'entertainment',
      'sports', 'gear',
      'food', 'laundry', 'baby_kids', 'pets', 'religious', 'accessibility'
    )
  );

alter table packmate.trip_entries
  add column category text,
  add constraint trip_entries_category_valid check (
    category is null or category in (
      'documents', 'valuables', 'health',
      'clothing', 'footwear', 'swim_beach', 'formal',
      'toiletries', 'comfort',
      'electronics', 'work_study', 'entertainment',
      'sports', 'gear',
      'food', 'laundry', 'baby_kids', 'pets', 'religious', 'accessibility'
    )
  );

-- ===========================================================================
-- Copy-on-add (updated to carry the category column)
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
    description, link, image_url, weight_grams, category
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
    i.weight_grams,
    i.category
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
    description, link, image_url, weight_grams, category
  )
  values (
    p_trip_id, p_trip_bag_id, v_item.name, v_item.default_qty, p_item_id, v_next_pos,
    v_item.description, v_item.link, v_item.image_url, v_item.weight_grams, v_item.category
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

-- ===========================================================================
-- Public read (updated to carry the category column)
--
-- The projection stays explicit: adding a column to the tables does not add it
-- to the public payload unless it is listed here. The version moves to 2 to
-- signal the shape change.
-- ===========================================================================

create or replace function packmate.get_shared_trip(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = packmate
as $$
declare
  v_trip record;
begin
  if p_token is null or length(btrim(p_token)) = 0 then
    return null;
  end if;

  select t.id, t.name, t.start_date, t.end_date
  into v_trip
  from share_links s
  join trips t on t.id = s.trip_id
  where s.token = p_token
    and s.revoked_at is null
    and (s.expires_at is null or s.expires_at > now());

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'v', 2,
    'trip', jsonb_build_object(
      'name', v_trip.name,
      'start_date', v_trip.start_date,
      'end_date', v_trip.end_date
    ),
    'bags', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'parent_bag_id', b.parent_bag_id,
          'position', b.position,
          'weight_limit_grams', b.weight_limit_grams
        )
        order by b.position, b.name
      )
      from trip_bags b
      where b.trip_id = v_trip.id
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'trip_bag_id', e.trip_bag_id,
          'name', e.name,
          'qty', e.qty,
          'is_with_me', e.is_with_me,
          'is_packed', e.is_packed,
          'position', e.position,
          'description', e.description,
          'link', e.link,
          'image_url', e.image_url,
          'weight_grams', e.weight_grams,
          'category', e.category
        )
        order by e.position, e.name
      )
      from trip_entries e
      where e.trip_id = v_trip.id
    ), '[]'::jsonb)
  );
end;
$$;
