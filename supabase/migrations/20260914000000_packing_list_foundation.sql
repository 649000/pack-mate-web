-- Packing List Foundation
-- Schema: packmate
-- Library (reusable items/bags) + trip-scoped copies (copy-on-add).
-- Identity is Firebase Auth via Supabase third-party auth: the Firebase uid is
-- the JWT subject claim, so ownership is matched as text against auth.jwt()->>'sub'
-- (Firebase uids are not UUIDs, so auth.uid() cannot be used).

create schema if not exists packmate;

grant usage on schema packmate to anon, authenticated, service_role;

-- ===========================================================================
-- Library
-- ===========================================================================

create table packmate.reusable_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null,
  default_qty integer not null default 1,
  created_at timestamptz not null default now(),
  constraint reusable_items_name_not_blank check (length(btrim(name)) > 0),
  constraint reusable_items_default_qty_positive check (default_qty > 0)
);

create table packmate.reusable_bags (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null,
  created_at timestamptz not null default now(),
  constraint reusable_bags_name_not_blank check (length(btrim(name)) > 0)
);

create table packmate.reusable_bag_items (
  id uuid primary key default gen_random_uuid(),
  bag_id uuid not null references packmate.reusable_bags (id) on delete cascade,
  item_id uuid not null references packmate.reusable_items (id) on delete cascade,
  qty integer not null default 1,
  position integer not null default 0,
  constraint reusable_bag_items_qty_positive check (qty > 0),
  constraint reusable_bag_items_unique unique (bag_id, item_id)
);

-- ===========================================================================
-- Trips
-- ===========================================================================

create table packmate.trips (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  constraint trips_name_not_blank check (length(btrim(name)) > 0),
  constraint trips_dates_ordered check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create table packmate.trip_bags (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references packmate.trips (id) on delete cascade,
  name text not null,
  source_bag_id uuid references packmate.reusable_bags (id) on delete set null,
  position integer not null default 0,
  constraint trip_bags_name_not_blank check (length(btrim(name)) > 0)
);

create table packmate.trip_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references packmate.trips (id) on delete cascade,
  trip_bag_id uuid references packmate.trip_bags (id) on delete cascade,
  name text not null,
  qty integer not null default 1,
  source_item_id uuid references packmate.reusable_items (id) on delete set null,
  is_with_me boolean not null default false,
  is_packed boolean not null default false,
  position integer not null default 0,
  constraint trip_entries_name_not_blank check (length(btrim(name)) > 0),
  constraint trip_entries_qty_positive check (qty > 0),
  -- Bag membership and "With Me" are mutually exclusive.
  constraint trip_entries_location_exclusive check (
    not (trip_bag_id is not null and is_with_me)
  )
);

create index reusable_items_user_id_idx on packmate.reusable_items (user_id);
create index reusable_bags_user_id_idx on packmate.reusable_bags (user_id);
create index reusable_bag_items_bag_id_idx on packmate.reusable_bag_items (bag_id);
create index reusable_bag_items_item_id_idx on packmate.reusable_bag_items (item_id);
create index trips_user_id_idx on packmate.trips (user_id);
create index trip_bags_trip_id_idx on packmate.trip_bags (trip_id);
create index trip_entries_trip_id_idx on packmate.trip_entries (trip_id);
create index trip_entries_trip_bag_id_idx on packmate.trip_entries (trip_bag_id);

-- ===========================================================================
-- Row Level Security
--
-- Every table is locked down. Tables with a direct user_id are scoped by the
-- Firebase subject claim; child tables are scoped through their parent.
-- Note: additionally add a restrictive policy scoping the issuer/audience to
-- your Firebase project id (see Supabase third-party auth docs) so tokens from
-- unrelated Firebase projects are rejected.
-- ===========================================================================

alter table packmate.reusable_items enable row level security;
alter table packmate.reusable_bags enable row level security;
alter table packmate.reusable_bag_items enable row level security;
alter table packmate.trips enable row level security;
alter table packmate.trip_bags enable row level security;
alter table packmate.trip_entries enable row level security;

-- reusable_items -----------------------------------------------------------------
create policy reusable_items_select on packmate.reusable_items
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_items_insert on packmate.reusable_items
  for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_items_update on packmate.reusable_items
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_items_delete on packmate.reusable_items
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

-- reusable_bags ------------------------------------------------------------------
create policy reusable_bags_select on packmate.reusable_bags
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_bags_insert on packmate.reusable_bags
  for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_bags_update on packmate.reusable_bags
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy reusable_bags_delete on packmate.reusable_bags
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

-- reusable_bag_items (via parent bag) --------------------------------------------
create policy reusable_bag_items_select on packmate.reusable_bag_items
  for select to authenticated
  using (
    exists (
      select 1 from packmate.reusable_bags b
      where b.id = bag_id and b.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy reusable_bag_items_insert on packmate.reusable_bag_items
  for insert to authenticated
  with check (
    exists (
      select 1 from packmate.reusable_bags b
      where b.id = bag_id and b.user_id = (auth.jwt() ->> 'sub')
    )
    and exists (
      select 1 from packmate.reusable_items i
      where i.id = item_id and i.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy reusable_bag_items_update on packmate.reusable_bag_items
  for update to authenticated
  using (
    exists (
      select 1 from packmate.reusable_bags b
      where b.id = bag_id and b.user_id = (auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from packmate.reusable_bags b
      where b.id = bag_id and b.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy reusable_bag_items_delete on packmate.reusable_bag_items
  for delete to authenticated
  using (
    exists (
      select 1 from packmate.reusable_bags b
      where b.id = bag_id and b.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- trips --------------------------------------------------------------------------
create policy trips_select on packmate.trips
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy trips_insert on packmate.trips
  for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy trips_update on packmate.trips
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy trips_delete on packmate.trips
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

-- trip_bags (via parent trip) ----------------------------------------------------
create policy trip_bags_select on packmate.trip_bags
  for select to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy trip_bags_insert on packmate.trip_bags
  for insert to authenticated
  with check (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy trip_bags_update on packmate.trip_bags
  for update to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy trip_bags_delete on packmate.trip_bags
  for delete to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- trip_entries (via parent trip; a bag reference must belong to the same trip) ---
create policy trip_entries_select on packmate.trip_entries
  for select to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy trip_entries_insert on packmate.trip_entries
  for insert to authenticated
  with check (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
    and (
      trip_bag_id is null
      or exists (
        select 1 from packmate.trip_bags b
        where b.id = trip_bag_id and b.trip_id = trip_entries.trip_id
      )
    )
  );

create policy trip_entries_update on packmate.trip_entries
  for update to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  )
  with check (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
    and (
      trip_bag_id is null
      or exists (
        select 1 from packmate.trip_bags b
        where b.id = trip_bag_id and b.trip_id = trip_entries.trip_id
      )
    )
  );

create policy trip_entries_delete on packmate.trip_entries
  for delete to authenticated
  using (
    exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- ===========================================================================
-- Table privileges (RLS still applies)
-- ===========================================================================

grant select, insert, update, delete on all tables in schema packmate to authenticated;

-- ===========================================================================
-- Copy-on-add
--
-- Adding a library bag or item to a trip copies it into trip-scoped rows.
-- Later edits to the library do not change existing trips. Functions run as
-- the caller (security invoker) so RLS still applies.
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

  insert into trip_entries (trip_id, trip_bag_id, name, qty, source_item_id, position)
  select
    p_trip_id,
    v_trip_bag_id,
    i.name,
    bi.qty,
    i.id,
    (row_number() over (order by bi.position, i.name) - 1)::integer
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

  insert into trip_entries (trip_id, trip_bag_id, name, qty, source_item_id, position)
  values (p_trip_id, p_trip_bag_id, v_item.name, v_item.default_qty, p_item_id, v_next_pos)
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

grant execute on function packmate.add_library_bag_to_trip(uuid, uuid) to authenticated;
grant execute on function packmate.add_library_item_to_trip(uuid, uuid, uuid) to authenticated;
