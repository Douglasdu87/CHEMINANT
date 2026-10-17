-- =========================================================
-- Photos de profil : une photo principale (exigée) et 3 photos facultatives.
-- Les fichiers sont dans le bucket privé « photos » (jamais lu directement par
-- le navigateur) ; l'Edge Function les sert par des liens signés (GET /photo/…).
-- =========================================================

alter table public.member_profiles
  add column if not exists photo_path text,
  add column if not exists extra_photos text[] not null default '{}';

alter table public.member_profiles
  drop constraint if exists member_profiles_extra_photos_max;
alter table public.member_profiles
  add constraint member_profiles_extra_photos_max check (coalesce(array_length(extra_photos, 1), 0) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];
