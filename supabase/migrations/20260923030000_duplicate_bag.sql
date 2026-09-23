-- Duplicate a reusable bag
-- Schema: packmate
-- Atomically copies a library bag and its default contents. Runs as the caller
-- (security invoker) so RLS still applies, and verifies the caller owns the
-- source. The copy's name is suffixed " (copy)" and kept within the 200-character
-- name limit; the source is never modified.

create or replace function packmate.duplicate_bag(p_bag_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_uid text := (auth.jwt() ->> 'sub');
  v_bag record;
  v_new_bag_id uuid;
  v_name text;
begin
  select * into v_bag
  from reusable_bags b
  where b.id = p_bag_id and b.user_id = v_uid;

  if not found then
    raise exception 'bag not found' using errcode = '42501';
  end if;

  v_name := left(btrim(v_bag.name), 193) || ' (copy)';

  insert into reusable_bags (user_id, name, weight_limit_grams, icon)
  values (v_uid, v_name, v_bag.weight_limit_grams, v_bag.icon)
  returning id into v_new_bag_id;

  insert into reusable_bag_items (bag_id, item_id, qty, position)
  select v_new_bag_id, bi.item_id, bi.qty, bi.position
  from reusable_bag_items bi
  where bi.bag_id = p_bag_id;

  return v_new_bag_id;
end;
$$;

revoke all on function packmate.duplicate_bag(uuid) from public;
grant execute on function packmate.duplicate_bag(uuid) to authenticated;
