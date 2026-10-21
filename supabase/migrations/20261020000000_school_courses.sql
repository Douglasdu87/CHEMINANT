-- =========================================================
-- CHEMINONS — cours de l'École du mariage gérés par l'administrateur
-- Chaque cours est un fichier MP3 (audio) ou MP4 (vidéo) du bucket privé
-- « courses ». Le navigateur de l'administrateur y dépose le fichier avec un
-- lien d'envoi signé fourni par l'Edge Function ; les membres le lisent par un
-- lien signé (GET /media/:jeton), seulement pour les modules qui leur sont ouverts.
-- =========================================================

-- La progression suit désormais l'identifiant du cours (et non plus sa place
-- dans le module) : un cours ajouté, déplacé ou supprimé ne fausse rien.
-- Les lignes existantes portaient sur les cours d'exemple, qui disparaissent.
truncate public.course_progress;
alter table public.course_progress
  drop constraint course_progress_pkey,
  drop column module_id,
  drop column idx,
  add column course_id int not null references public.courses(id) on delete cascade,
  add primary key (user_id, course_id);
create index course_progress_course on public.course_progress (course_id);

alter table public.courses
  drop constraint if exists courses_module_id_position_key,
  drop column media_url,
  add column storage_path text not null unique,
  add column description  text not null default '' check (length(description) <= 1000),
  add column created_at   timestamptz not null default now(),
  add column updated_at   timestamptz not null default now(),
  add constraint courses_module_check check (module_id between 1 and 10),
  add constraint courses_title_check check (length(title) between 1 and 160),
  add constraint courses_minutes_check check (minutes between 0 and 600);
alter table public.courses alter column speaker set default '';
create index courses_module on public.courses (module_id, position);

alter table public.courses enable row level security;
alter table public.course_progress enable row level security;

-- Fichiers des cours : 50 Mo par fichier (limite de l'offre gratuite de Supabase)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('courses', 'courses', false, 52428800, array['audio/mpeg', 'video/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
