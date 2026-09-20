-- Trip destination
-- Schema: packmate
-- Optional place label and required country for a trip. The country is stored
-- as an ISO 3166-1 alpha-2 code so future destination-aware features can rely
-- on a stable value; the application maps it to a display name and never shows
-- the raw code. The database is the integrity boundary, mirroring
-- lib/countries.ts and lib/validation.ts. There is no existing trip data, so
-- the new required column needs no backfill.

alter table packmate.trips
  add column destination text,
  add column country_code text not null,
  add constraint trips_destination_length check (
    destination is null or length(btrim(destination)) between 1 and 200
  ),
  add constraint trips_country_code_valid check (
    country_code in (
      'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
      'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
      'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
      'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
      'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
      'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
      'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
      'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
      'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
      'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
      'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
      'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
      'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
      'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
      'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
      'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
      'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
      'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
      'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
      'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
      'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
    )
  );

-- ===========================================================================
-- Public share projection
-- The shared view gains the destination and country name. The payload version
-- moves from 1 to 2 to signal the shape change.
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
    'v', 2,
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
