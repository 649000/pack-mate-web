-- Bulk packed actions
-- Schema: packmate
-- Sets the packed state for every entry of a trip in one statement. Packed
-- state is the only column changed. Runs as the caller (security invoker) so
-- RLS still applies, and verifies the caller owns the trip.

create or replace function packmate.set_trip_packed(
  p_trip_id uuid,
  p_packed boolean
)
returns void
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_uid text := (auth.jwt() ->> 'sub');
begin
  if not exists (
    select 1 from trips t where t.id = p_trip_id and t.user_id = v_uid
  ) then
    raise exception 'trip not found' using errcode = '42501';
  end if;

  update trip_entries
  set is_packed = p_packed
  where trip_id = p_trip_id;
end;
$$;

revoke all on function packmate.set_trip_packed(uuid, boolean) from public;
grant execute on function packmate.set_trip_packed(uuid, boolean) to authenticated;
