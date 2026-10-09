-- =========================================================
-- CHEMINANT — schéma PostgreSQL pour Neon
-- À exécuter une fois dans l'éditeur SQL de la console Neon
-- (ou : psql "$DATABASE_URL" -f db/schema.sql).
-- Les statuts reprennent exactement ceux de l'interface (CLAUDE.md).
-- =========================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- e-mails insensibles à la casse

-- ---------- Types énumérés ----------
create type user_role          as enum ('membre', 'referent', 'eglise', 'admin');
create type gender             as enum ('F', 'M');
create type candidate_status   as enum ('en_attente_validation', 'actif', 'en_pause', 'refuse');
create type interview_status   as enum ('a_planifier', 'planifie', 'realise');
create type referent_decision  as enum ('valider', 'refuser', 'demander_infos', 'mettre_en_attente');
create type relation_status    as enum ('interet', 'interet_reciproque', 'mise_en_relation', 'couple_en_cheminement', 'cloturee');
create type convergence_level  as enum ('forte', 'convergence', 'compatible', 'discuter');
create type church_request_status as enum ('nouvelle', 'acceptee', 'refusee');
create type lesson_format      as enum ('video', 'audio', 'texte', 'pdf', 'questionnaire', 'exercice');
create type billing_region     as enum ('europe', 'afrique');
create type plan_key           as enum ('single', 'cheminant');
create type beneficiary_type   as enum ('referent', 'eglise');

-- ---------- Églises et référents ----------
create table churches (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  city          text not null,
  denomination  text not null,
  region        billing_region not null default 'europe',   -- détermine les tarifs et la devise
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  password_hash  text not null,                -- argon2id / bcrypt, jamais en clair
  role           user_role not null default 'membre',
  first_name     text not null,
  last_name      text not null,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz                   -- suppression logique (RGPD : purge planifiée)
);

create table church_referents (
  church_id  uuid not null references churches(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  title      text,                              -- « Pasteur », « Père », « Pasteure »…
  primary key (church_id, user_id)
);

-- Comptes « église » (trésorerie) : voient uniquement les reversements de leur église
create table church_accounts (
  church_id  uuid not null references churches(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  primary key (church_id, user_id)
);

create table church_requests (
  id            uuid primary key default gen_random_uuid(),
  church_name   text not null,
  city          text not null,
  denomination  text not null,
  contact_name  text not null,
  contact_email citext,
  referent_name text not null,
  members_range text,
  status        church_request_status not null default 'nouvelle',
  questions     text[] not null default '{}',     -- précisions demandées par l'administrateur
  admin_message text,
  asked_at      timestamptz,
  reviewed_by   uuid references users(id),
  created_at    timestamptz not null default now()
);

-- ---------- Profils membres ----------
create table member_profiles (
  user_id      uuid primary key references users(id) on delete cascade,
  church_id    uuid not null references churches(id),
  gender       gender not null,
  birth_date   date not null,
  city         text not null,
  job          text,
  quote        text,
  about        text,
  faith        text,
  children     text,
  mobility     text,
  service      text,
  languages    text,
  interests    text[] not null default '{}',
  avatar_colors text[] not null default '{}',   -- avatars à initiales, pas de photos
  status       candidate_status not null default 'en_attente_validation',
  plan         plan_key not null default 'single',          -- formule choisie à l'inscription
  paid_until   timestamptz,                                 -- formule réglée jusqu'à cette date (messagerie si > now())
  suggestions_enabled boolean not null default true,
  updated_at   timestamptz not null default now()
);
create index member_profiles_search on member_profiles (status, gender, city);

-- Réponses au questionnaire de compatibilité (une ligne par dimension)
create table questionnaire_answers (
  user_id    uuid not null references users(id) on delete cascade,
  dimension  text not null,                     -- Foi, Vision du mariage, Projet familial…
  answer     jsonb not null,
  primary key (user_id, dimension)
);

-- Compatibilité calculée côté serveur. Le score n'est JAMAIS exposé tel quel :
-- l'API ne renvoie que les 5 points de convergence (level).
create table compatibility (
  user_a       uuid not null references users(id) on delete cascade,
  user_b       uuid not null references users(id) on delete cascade,
  score        smallint not null check (score between 0 and 100),
  convergences jsonb not null,                  -- [{ "label": "Vision chrétienne", "level": "forte" }, …]
  computed_at  timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- ---------- Validation par le référent ----------
create table candidate_reviews (
  user_id        uuid primary key references users(id) on delete cascade,
  referent_id    uuid references users(id),
  interview      interview_status not null default 'a_planifier',
  interview_at   timestamptz,
  interview_place text,
  decision       referent_decision,
  internal_note  text,                          -- motif interne : jamais renvoyé au candidat
  decided_at     timestamptz
);

-- ---------- Intérêts et mises en relation ----------
create table interests (
  from_user   uuid not null references users(id) on delete cascade,
  to_user     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);

create table profile_passes (
  user_id     uuid not null references users(id) on delete cascade,
  passed_user uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, passed_user)
);

-- Créée par le serveur dès que l'intérêt devient réciproque
create table relations (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references users(id) on delete cascade,
  user_b      uuid not null references users(id) on delete cascade,
  status      relation_status not null default 'mise_en_relation',
  created_at  timestamptz not null default now(),      -- début des 3 mois d'échange
  a_activated_at timestamptz,                          -- activation du parcours Cheminant par user_a
  b_activated_at timestamptz,                          -- … et par user_b (couple quand les deux sont renseignées)
  unique (user_a, user_b),
  check (a_activated_at is null or a_activated_at >= created_at + interval '3 months'),
  check (b_activated_at is null or b_activated_at >= created_at + interval '3 months'),
  check (user_a < user_b)
);

-- Messagerie : une conversation par paire de membres, ouverte entre membres
-- validés (statut actif) et à jour de leur formule. Le fil d'une relation
-- (« Notre cheminement ») est la conversation de la même paire.
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references users(id) on delete cascade,
  user_b      uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid references users(id),    -- null = message système
  body            text not null check (length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index messages_by_conversation on messages (conversation_id, created_at);

create table message_reactions (
  message_id  bigint not null references messages(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  reaction    text not null check (reaction in ('amen', 'merci', 'bravo')),
  primary key (message_id, user_id)
);

create table member_blocks (
  user_id     uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);

-- Signalements : transmis au référent de l'église du signalant ET à l'administrateur,
-- qui seul décide. L'auteur n'est jamais révélé au membre signalé.
create table member_reports (
  id            bigint generated always as identity primary key,
  reporter_id   uuid not null references users(id) on delete cascade,
  reported_id   uuid not null references users(id) on delete cascade,
  reason        text not null,
  details       text,
  context       text not null,                     -- « Messagerie », « Notre cheminement »
  excerpt       text[] not null default '{}',      -- extraits joints volontairement par le signalant
  referent_note text,                              -- avis consultatif du référent
  status        text not null default 'nouveau' check (status in ('nouveau', 'traite')),
  decision      text check (decision in ('avertissement', 'suspension', 'desactivation', 'classe')),
  decided_by    uuid references users(id),         -- administrateur
  decided_at    timestamptz,
  admin_note    text,
  created_at    timestamptz not null default now()
);

-- Sanctions décidées par l'administrateur. Suspension : 2 jours minimum.
-- Désactivation : seulement en cas de récidive (sanction antérieure), contrôlé par l'API.
create table member_sanctions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references users(id) on delete cascade,
  report_id   bigint references member_reports(id),
  type        text not null check (type in ('avertissement', 'suspension', 'desactivation')),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,                         -- suspension uniquement
  lifted_at   timestamptz,
  decided_by  uuid not null references users(id),
  note        text,
  check (type <> 'suspension' or ends_at >= starts_at + interval '2 days')
);
create index member_sanctions_by_user on member_sanctions (user_id);

create table discernment_steps (
  relation_id uuid not null references relations(id) on delete cascade,
  step_index  smallint not null,
  done_at     timestamptz not null default now(),
  primary key (relation_id, step_index)
);

create table accompaniment_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  about_user  uuid references users(id),
  message     text,
  created_at  timestamptz not null default now()
);

-- ---------- École du mariage et préparation ----------
create table modules (
  id         smallint primary key,
  title      text not null,
  duration   text,
  topics     text[] not null default '{}',
  verse_text text,
  verse_ref  text,
  specialised boolean not null default false     -- mention « contenus élaborés avec des professionnels »
);

create table lessons (
  module_id  smallint not null references modules(id) on delete cascade,
  idx        smallint not null,
  format     lesson_format not null,
  title      text not null,
  content    jsonb,                              -- URL vidéo/audio/PDF, texte, questions…
  primary key (module_id, idx)
);

-- Paiements des formules (confirmés par le prestataire via webhook ; aucune donnée bancaire stockée)
create table payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete restrict,
  plan           plan_key not null,
  method         text not null,                    -- carte, paypal, mobile
  provider       text not null,                    -- stripe, paypal, agrégateur Mobile Money
  region         billing_region not null,
  currency       char(3) not null,
  amount_ttc     numeric(12,2) not null,
  provider_ref   text unique,                      -- identifiant de la transaction chez le prestataire
  status         text not null default 'en_attente' check (status in ('en_attente', 'paye', 'echoue', 'rembourse')),
  period_end     timestamptz,                      -- reporté dans member_profiles.paid_until
  created_at     timestamptz not null default now()
);

-- Cours vidéo et audio de l'École du mariage (une ligne par cours)
create table courses (
  id          serial primary key,
  module_id   smallint not null,
  position    smallint not null,
  title       text not null,
  media_type  text not null check (media_type in ('video', 'audio')),
  media_url   text not null,                       -- fichier hébergé (stockage objet / CDN)
  minutes     smallint not null,
  speaker     text,
  unique (module_id, position)
);

-- Cours suivis, par personne : progression visible du couple, du référent et de l'administrateur
create table course_views (
  course_id   int not null references courses(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  watched_at  timestamptz not null default now(),
  primary key (course_id, user_id)
);

create table lesson_progress (
  user_id    uuid not null references users(id) on delete cascade,
  module_id  smallint not null,
  idx        smallint not null,
  done_at    timestamptz not null default now(),
  primary key (user_id, module_id, idx),
  foreign key (module_id, idx) references lessons(module_id, idx) on delete cascade
);

create table prep_sessions_done (
  relation_id   uuid not null references relations(id) on delete cascade,
  session_index smallint not null,
  done_at       timestamptz not null default now(),
  primary key (relation_id, session_index)
);

create table prep_tasks_done (
  relation_id uuid not null references relations(id) on delete cascade,
  task_key    text not null,
  done_at     timestamptz not null default now(),
  primary key (relation_id, task_key)
);

create table weddings (
  relation_id  uuid primary key references relations(id) on delete cascade,
  wedding_date date,
  celebrated   boolean not null default false
);

-- ---------- Notifications ----------
create table notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references users(id) on delete cascade,
  icon       text not null,
  body       text not null,
  href       text not null,                      -- adresse dans l'application : #/interets…
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread on notifications (user_id) where read_at is null;

-- ---------- Tarifs, inscriptions validées et reversements ----------
-- Prix TTC par région et formule (SINGLE mensuel, CHEMINANT trimestriel)
create table plan_prices (
  region     billing_region not null,
  plan       plan_key not null,
  currency   char(3) not null,                    -- EUR, XOF
  amount_ttc numeric(12,2) not null check (amount_ttc > 0),
  tax_rate   numeric(5,4) not null,               -- 0.2000 = 20 %
  months     smallint not null,
  primary key (region, plan)
);

-- Une ligne par inscription validée : vaut le prix de la formule choisie.
-- Créée par le serveur au moment où le référent enregistre la décision « valider ».
create table validated_registrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete restrict,
  plan         plan_key not null,
  region       billing_region not null,
  currency     char(3) not null,
  amount_ttc   numeric(12,2) not null,
  tax_rate     numeric(5,4) not null,
  amount_ht    numeric(12,2) not null,           -- montant après déduction des taxes
  referent_id  uuid not null references users(id),
  church_id    uuid not null references churches(id),
  validated_at timestamptz not null default now(),
  unique (user_id)
);

-- Reversements : 10 % du montant HT au référent qui a validé, 10 % à son église.
-- Chaque bénéficiaire ne doit lire QUE ses propres lignes (contrôle fait par l'API).
create table reversements (
  id               bigint generated always as identity primary key,
  registration_id  uuid not null references validated_registrations(id) on delete cascade,
  beneficiary      beneficiary_type not null,
  referent_id      uuid references users(id),
  church_id        uuid references churches(id),
  rate             numeric(5,4) not null,         -- 0.1000
  amount           numeric(12,2) not null,
  currency         char(3) not null,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  check ((beneficiary = 'referent' and referent_id is not null and church_id is null)
      or (beneficiary = 'eglise' and church_id is not null and referent_id is null)),
  unique (registration_id, beneficiary)
);
create index reversements_referent on reversements (referent_id) where beneficiary = 'referent';
create index reversements_church on reversements (church_id) where beneficiary = 'eglise';

-- Grand livre pour le super administrateur : une ligne par inscription validée,
-- avec la part du référent, de l'église et de Cheminant (le reste du montant HT).
create view admin_ledger as
select
  vr.id, vr.validated_at, vr.user_id, vr.plan, vr.region, vr.currency,
  vr.amount_ttc, vr.amount_ttc - vr.amount_ht as taxes, vr.amount_ht,
  vr.referent_id, vr.church_id,
  coalesce(r_ref.amount, 0)    as part_referent,
  coalesce(r_church.amount, 0) as part_eglise,
  vr.amount_ht - coalesce(r_ref.amount, 0) - coalesce(r_church.amount, 0) as part_cheminant
from validated_registrations vr
left join reversements r_ref    on r_ref.registration_id = vr.id and r_ref.beneficiary = 'referent'
left join reversements r_church on r_church.registration_id = vr.id and r_church.beneficiary = 'eglise';
