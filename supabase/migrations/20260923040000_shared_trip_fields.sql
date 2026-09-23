-- The public share projection was rewritten for trip destination (v2) without
-- carrying the fields added by earlier changes: entry `category` (item
-- categories) and bag `icon` (bag identity). The shared view renders both, so a
-- public list with a categorised item or an iconed bag crashed the page. This
-- restores them and moves the payload version to 3.

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

  select t.id, t.name, t.start_date, t.end_date, t.destination, t.country_code
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
    'v', 3,
    'trip', jsonb_build_object(
      'name', v_trip.name,
      'start_date', v_trip.start_date,
      'end_date', v_trip.end_date,
      'destination', v_trip.destination,
      'country_code', v_trip.country_code
    ),
    'bags', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'parent_bag_id', b.parent_bag_id,
          'position', b.position,
          'weight_limit_grams', b.weight_limit_grams,
          'icon', b.icon
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

revoke all on function packmate.get_shared_trip(text) from public;
grant execute on function packmate.get_shared_trip(text) to anon, authenticated;
