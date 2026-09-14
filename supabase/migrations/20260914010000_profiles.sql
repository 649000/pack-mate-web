-- User profiles
-- Schema: packmate
-- Optional personal details for the account page. Identity is Firebase Auth via
-- Supabase third-party auth: the Firebase uid is the JWT subject claim, so
-- ownership is matched as text against auth.jwt()->>'sub'.

create table packmate.profiles (
  user_id text primary key default (auth.jwt() ->> 'sub'),
  display_name text,
  birthday date,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or length(btrim(display_name)) between 1 and 80
  ),
  constraint profiles_birthday_not_future check (
    birthday is null or birthday <= current_date
  ),
  constraint profiles_gender_valid check (
    gender is null or gender in ('female', 'male', 'other', 'prefer_not_to_say')
  )
);

alter table packmate.profiles enable row level security;

create policy profiles_select on packmate.profiles
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy profiles_insert on packmate.profiles
  for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy profiles_update on packmate.profiles
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy profiles_delete on packmate.profiles
  for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

grant select, insert, update, delete on packmate.profiles to authenticated;
