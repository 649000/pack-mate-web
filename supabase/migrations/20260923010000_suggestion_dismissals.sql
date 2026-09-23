-- Suggestion dismissals
-- Schema: packmate
-- A dismissed packing suggestion stays dismissed for that user and trip, across
-- devices. "Adding" a suggestion is tracked implicitly because the item then
-- exists on the trip, so only dismissals need storage.

create table packmate.suggestion_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  trip_id uuid not null references packmate.trips (id) on delete cascade,
  suggestion_key text not null,
  source text not null default 'rules',
  dismissed_at timestamptz not null default now(),
  constraint suggestion_dismissals_key_not_blank check (length(btrim(suggestion_key)) > 0),
  constraint suggestion_dismissals_unique unique (user_id, trip_id, suggestion_key)
);

create index suggestion_dismissals_trip_user_idx
  on packmate.suggestion_dismissals (trip_id, user_id);

alter table packmate.suggestion_dismissals enable row level security;

create policy suggestion_dismissals_select on packmate.suggestion_dismissals
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy suggestion_dismissals_insert on packmate.suggestion_dismissals
  for insert to authenticated
  with check (
    user_id = (auth.jwt() ->> 'sub')
    and exists (
      select 1 from packmate.trips t
      where t.id = trip_id and t.user_id = (auth.jwt() ->> 'sub')
    )
  );

create policy suggestion_dismissals_delete on packmate.suggestion_dismissals
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

grant select, insert, update, delete on packmate.suggestion_dismissals to authenticated;
