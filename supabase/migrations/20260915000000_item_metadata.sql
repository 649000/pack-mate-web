-- Item details: description, link and image URL
-- Schema: packmate
-- Optional metadata for reusable items. The copy-on-add functions are replaced
-- so the details are copied onto trip entries when an item or bag is added.

alter table packmate.reusable_items
  add column description text,
  add column link text,
  add column image_url text,
  add constraint reusable_items_description_length check (
    description is null or length(description) <= 2000
  ),
  add constraint reusable_items_link_http check (
    link is null or link ~* '^https?://\S+$'
  ),
  add constraint reusable_items_image_url_http check (
    image_url is null or image_url ~* '^https?://\S+$'
  );

alter table packmate.trip_entries
  add column description text,
  add column link text,
  add column image_url text,
  add constraint trip_entries_description_length check (
    description is null or length(description) <= 2000
  ),
  add constraint trip_entries_link_http check (
    link is null or link ~* '^https?://\S+$'
  ),
  add constraint trip_entries_image_url_http check (
    image_url is null or image_url ~* '^https?://\S+$'
  );

-- ===========================================================================
-- Copy-on-add (updated to carry the new detail columns)
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

  insert into trip_bags (trip_id, name, source_bag_id, position)
  values (p_trip_id, v_bag.name, p_bag_id, v_next_pos)
  returning id into v_trip_bag_id;

  insert into trip_entries (
    trip_id, trip_bag_id, name, qty, source_item_id, position,
    description, link, image_url
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
    i.image_url
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
    description, link, image_url
  )
  values (
    p_trip_id, p_trip_bag_id, v_item.name, v_item.default_qty, p_item_id, v_next_pos,
    v_item.description, v_item.link, v_item.image_url
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;
