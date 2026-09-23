-- Profile theme preference
-- Schema: packmate
-- Persists the signed-in user's light/dark choice on their account so it
-- follows them across desktop and mobile. The client theme library keeps a
-- local cache purely so a returning device renders without a flash.

alter table packmate.profiles
  add column theme text not null default 'light',
  add constraint profiles_theme_valid check (theme in ('light', 'dark'));
