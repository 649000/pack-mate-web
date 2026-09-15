-- Public share links
-- Schema: packmate
-- A trip owner can create an opaque public link to a trip. Anonymous visitors
-- read a curated projection through a single security definer function; the
-- anon role keeps zero direct table access, so the exposed field set is
-- explicit rather than inferred from the schema.

create table packmate.share_links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references packmate.trips (id) on delete cascade,
  user_id text not null default (auth.jwt() ->> 'sub'),
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create index share_links_trip_id_idx on packmate.share_links (trip_id);
create index share_links_user_id_idx on packmate.share_links (user_id);
-- At most one active link per trip. Regenerating revokes the current row and
-- inserts a new one, so a revoked URL can never come back to life.
create unique index share_links_active_trip_idx
  on packmate.share_links (trip_id)
  where revoked_at is null;

alter table packmate.share_links enable row level security;

-- Owner-only. An insert must also reference a trip the caller owns.
create policy share_links_select on packmate.share_links
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy share_links_insert on packmate.share_links
  for insert to authenticated
  with check (
    user_id = (auth.jwt() ->> 'sub')
    and exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy share_links_update on packmate.share_links
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy share_links_delete on packmate.share_links
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

grant select, insert, update, delete on packmate.share_links to authenticated;

-- ===========================================================================
-- Public read
--
-- One function is the entire anonymous surface. It validates the token, then
-- builds an explicit projection. It never returns user_id, source_item_id,
-- source_bag_id, profiles or any other trip. Unknown, revoked, expired and
-- deleted-trip all return null, so it cannot be used as an oracle.
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
    'v', 1,
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
          'weight_grams', e.weight_grams
        )
        order by e.position, e.name
      )
      from trip_entries e
      where e.trip_id = v_trip.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function packmate.get_shared_trip(text) from public;
grant execute on function packmate.get_shared_trip(text) to anon, authenticated;
