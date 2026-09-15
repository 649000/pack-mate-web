-- Nested containers
-- Schema: packmate
-- A trip bag may belong to another trip bag (single parent). Library bags stay
-- flat. A trigger enforces that a parent belongs to the same trip and that the
-- nesting is acyclic.

alter table packmate.trip_bags
  add column parent_bag_id uuid references packmate.trip_bags (id) on delete cascade;

create index trip_bags_parent_bag_id_idx on packmate.trip_bags (parent_bag_id);

create or replace function packmate.trip_bags_validate_parent()
returns trigger
language plpgsql
security invoker
set search_path = packmate
as $$
declare
  v_parent_trip_id uuid;
  v_ancestor uuid;
begin
  if new.parent_bag_id is null then
    return new;
  end if;

  if new.parent_bag_id = new.id then
    raise exception 'a bag cannot contain itself' using errcode = '23514';
  end if;

  select b.trip_id into v_parent_trip_id
  from trip_bags b
  where b.id = new.parent_bag_id;

  if not found then
    raise exception 'parent bag not found' using errcode = '23503';
  end if;

  if v_parent_trip_id <> new.trip_id then
    raise exception 'parent bag belongs to a different trip' using errcode = '23514';
  end if;

  -- Walk up from the proposed parent; reject if this bag is reached.
  v_ancestor := new.parent_bag_id;
  while v_ancestor is not null loop
    if v_ancestor = new.id then
      raise exception 'a bag cannot contain its own descendant' using errcode = '23514';
    end if;
    select b.parent_bag_id into v_ancestor
    from trip_bags b
    where b.id = v_ancestor;
  end loop;

  return new;
end;
$$;

create trigger trip_bags_validate_parent
  before insert or update of parent_bag_id, trip_id on packmate.trip_bags
  for each row
  execute function packmate.trip_bags_validate_parent();
