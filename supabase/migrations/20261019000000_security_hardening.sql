-- =========================================================
-- Durcissement de sécurité (audit du 19 octobre 2026)
-- Droits par défaut, consentement RGPD, compteurs anti-abus,
-- nettoyage des noms à l'inscription, récidive, purge des comptes.
-- =========================================================

-- ---------- Droits par défaut : rien pour le navigateur ----------
-- Une future table, vue ou fonction du schéma public n'est jamais accessible
-- par anon / authenticated sans un grant explicite.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;

-- ---------- RGPD art. 9 : consentement explicite aux données religieuses ----------
alter table public.member_profiles add column sensitive_consent_at timestamptz;

-- ---------- Compteurs anti-abus (limitation de débit de l'Edge Function) ----------
create table public.rate_events (
  id         bigint generated always as identity primary key,
  key        text not null,               -- identifiant du compte ou empreinte de l'adresse IP
  action     text not null,
  created_at timestamptz not null default now()
);
create index rate_events_lookup on public.rate_events (key, action, created_at);
alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;

-- ---------- Inscription : noms nettoyés comme côté serveur (balisage, contrôle) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    left(btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'first_name', ''), '[<>"`[:cntrl:]]', '', 'g')), 80),
    left(btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'last_name', ''), '[<>"`[:cntrl:]]', '', 'g')), 80)
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- Signalements : la récidive suppose une sanction issue d'un AUTRE signalement ----------
create or replace function public.api_decide_report(p_admin uuid, p_report bigint, p_decision text, p_days int, p_note text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  rep public.member_reports;
  v_days int := greatest(2, coalesce(p_days, 2));
begin
  select * into rep from public.member_reports where id = p_report for update;
  if rep.id is null then raise exception 'signalement introuvable' using errcode = 'P0002'; end if;
  if p_decision not in ('avertissement', 'suspension', 'desactivation', 'classe') then
    raise exception 'décision inconnue' using errcode = '22023';
  end if;
  if p_decision = 'desactivation' and not exists (
    select 1 from public.member_sanctions
    where user_id = rep.reported_id and type in ('avertissement', 'suspension') and report_id is distinct from p_report
  ) then
    raise exception 'désactivation réservée à la récidive' using errcode = '22023';
  end if;

  update public.member_reports set status = 'traite', decision = p_decision, decided_by = p_admin,
    decided_at = now(), admin_note = nullif(p_note, '') where id = p_report;

  if p_decision <> 'classe' then
    insert into public.member_sanctions (user_id, report_id, type, ends_at, decided_by, note)
    values (rep.reported_id, p_report, p_decision,
            case when p_decision = 'suspension' then now() + make_interval(days => v_days) end,
            p_admin, nullif(p_note, ''));
    insert into public.notifications (user_id, icon, body, href)
    values (rep.reported_id, 'shield',
      case p_decision
        when 'avertissement' then 'L''équipe Cheminant vous adresse un avertissement : merci de respecter la charte des échanges.'
        when 'suspension' then format('Votre compte est suspendu pendant %s jours pour non-respect de la charte des échanges.', v_days)
        else 'Votre compte a été désactivé pour non-respect répété de la charte des échanges.' end,
      '#/tableau-de-bord');
  end if;
  -- L'auteur apprend que son signalement a été traité, jamais la sanction
  insert into public.notifications (user_id, icon, body, href)
  values (rep.reporter_id, 'shield', 'Votre signalement a été examiné et traité par l''équipe Cheminant. Merci de veiller avec nous sur la communauté.', '#/messages');
end;
$$;
revoke execute on function public.api_decide_report(uuid, bigint, text, int, text) from public, anon, authenticated;
grant execute on function public.api_decide_report(uuid, bigint, text, int, text) to service_role;

-- ---------- Suppression d'un compte (RGPD art. 17) ----------
-- Efface le profil, les échanges et la progression ; pseudonymise le compte.
-- Restent, au titre des obligations légales et de la modération : paiements,
-- inscriptions validées et reversements, signalements et sanctions.
-- Les photos du bucket et le compte Supabase Auth sont traités par l'Edge Function.
create function public.api_purge_user(p_user uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.users where id = p_user and role = 'membre') then
    raise exception 'compte introuvable' using errcode = 'P0002';
  end if;
  delete from public.interests where from_user = p_user or to_user = p_user;
  delete from public.profile_passes where user_id = p_user or passed_user = p_user;
  delete from public.relations where user_a = p_user or user_b = p_user;          -- discernement, préparation : cascade
  delete from public.conversations where user_a = p_user or user_b = p_user;      -- messages, lectures, réactions : cascade
  delete from public.message_reactions where user_id = p_user;
  delete from public.member_blocks where user_id = p_user or blocked_id = p_user;
  delete from public.questionnaire_answers where user_id = p_user;
  delete from public.compatibility where user_a = p_user or user_b = p_user;
  delete from public.accompaniment_requests where user_id = p_user or about_user = p_user;
  delete from public.notifications where user_id = p_user;
  delete from public.course_progress where user_id = p_user;
  delete from public.module_progress where user_id = p_user;
  delete from public.module_notes where user_id = p_user;
  delete from public.candidate_reviews where user_id = p_user;
  delete from public.member_profiles where user_id = p_user;
  update public.users
     set first_name = 'Compte', last_name = 'supprimé', email = null, read_notifs = '{}',
         chat_charter_at = null, deleted_at = now()
   where id = p_user;
end;
$$;
revoke execute on function public.api_purge_user(uuid) from public, anon, authenticated;
grant execute on function public.api_purge_user(uuid) to service_role;
