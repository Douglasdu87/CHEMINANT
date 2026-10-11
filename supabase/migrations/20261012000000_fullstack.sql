-- =========================================================
-- CHEMINANT — compléments pour l'application complète
-- Champs utilisés par l'interface, progression des cours (le contenu reste
-- dans js/data.js), et fonctions métier transactionnelles appelées par
-- l'Edge Function « api » (service_role uniquement).
-- =========================================================

-- ---------- Comptes ----------
alter table public.users
  add column email           extensions.citext,
  add column chat_charter_at timestamptz,                    -- charte des échanges acceptée
  add column read_notifs     text[] not null default '{}',   -- notifications lues (calculées côté client)
  add column last_seen_at    timestamptz,                    -- présence dans la messagerie
  add column deletion_requested_at timestamptz;              -- demande de suppression (RGPD)

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
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 80)
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- Profils ----------
alter table public.member_profiles
  alter column birth_date drop not null,
  add column age            smallint check (age between 18 and 99),
  add column answers        jsonb not null default '{}',    -- questionnaire : foi, enfants, mobilité, valeurs
  add column member_since   text,                           -- « Plus de 3 ans »…
  add column paused         boolean not null default false,
  add column payment_method text,
  add column payment_region billing_region;

alter table public.candidate_reviews
  add column decision_message text,                         -- message neutre transmis au candidat
  add column created_at timestamptz not null default now();

-- Référents invités par une église ou l'administrateur
alter table public.church_referents
  add column invited_at timestamptz not null default now();

-- Demandes de partenariat : précisions demandées, demande déclinée
alter type public.church_request_status add value if not exists 'precisions';
alter type public.church_request_status add value if not exists 'declinee';
alter table public.church_requests
  add column phone   text,
  add column message text;

-- ---------- Progression (contenu dans js/data.js) ----------
drop table public.lesson_progress;
drop table public.course_views;

create table public.module_progress (
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  smallint not null check (module_id between 1 and 10),
  idx        smallint not null check (idx between 0 and 5),
  done_at    timestamptz not null default now(),
  primary key (user_id, module_id, idx)
);

create table public.course_progress (
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  smallint not null check (module_id between 1 and 10),
  idx        smallint not null check (idx between 0 and 20),
  done_at    timestamptz not null default now(),
  primary key (user_id, module_id, idx)
);

create table public.module_notes (
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  smallint not null check (module_id between 1 and 10),
  body       text not null check (length(body) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- Index utiles aux requêtes de l'Edge Function
create index interests_to on public.interests (to_user);
create index relations_b on public.relations (user_b);
create index conversations_b on public.conversations (user_b);
create index member_reports_reported on public.member_reports (reported_id);
create index validated_registrations_referent on public.validated_registrations (referent_id);
create index validated_registrations_church on public.validated_registrations (church_id);

-- ---------- Fonctions métier (transactionnelles) ----------

-- Décision du référent. Contrôle le périmètre (candidat de son église), met à jour
-- le statut, et à la validation crée l'inscription validée et les deux reversements
-- (10 % du HT au référent, 10 % à l'église). Le motif interne n'est jamais renvoyé.
create function public.api_decide_candidate(
  p_referent uuid, p_candidate uuid, p_decision public.referent_decision,
  p_note text, p_message text
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_church uuid;
  v_plan public.plan_key;
  v_region public.billing_region;
  v_price record;
  v_net numeric(12,2);
  v_round int;
  v_reg uuid;
begin
  select mp.church_id, mp.plan into v_church, v_plan
  from public.member_profiles mp where mp.user_id = p_candidate;
  if v_church is null then raise exception 'candidat introuvable' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.church_referents cr where cr.church_id = v_church and cr.user_id = p_referent) then
    raise exception 'hors périmètre' using errcode = '42501';
  end if;

  insert into public.candidate_reviews (user_id, referent_id, interview, decision, internal_note, decision_message, decided_at)
  values (p_candidate, p_referent, 'realise', p_decision, nullif(p_note, ''), nullif(p_message, ''), now())
  on conflict (user_id) do update set
    referent_id = excluded.referent_id, interview = 'realise', decision = excluded.decision,
    internal_note = excluded.internal_note, decision_message = excluded.decision_message, decided_at = now();

  update public.member_profiles set
    status = case p_decision when 'valider' then 'actif'::public.candidate_status
                             when 'refuser' then 'refuse'::public.candidate_status
                             else 'en_attente_validation'::public.candidate_status end,
    updated_at = now()
  where user_id = p_candidate;

  if p_decision = 'valider' then
    if not exists (select 1 from public.validated_registrations where user_id = p_candidate) then
      select c.region into v_region from public.churches c where c.id = v_church;
      select * into v_price from public.plan_prices where region = v_region and plan = v_plan;
      v_round := case when v_price.currency = 'XOF' then 0 else 2 end;
      v_net := round(v_price.amount_ttc / (1 + v_price.tax_rate), v_round);
      insert into public.validated_registrations (user_id, plan, region, currency, amount_ttc, tax_rate, amount_ht, referent_id, church_id)
      values (p_candidate, v_plan, v_region, v_price.currency, v_price.amount_ttc, v_price.tax_rate, v_net, p_referent, v_church)
      returning id into v_reg;
      insert into public.reversements (registration_id, beneficiary, referent_id, church_id, rate, amount, currency) values
        (v_reg, 'referent', p_referent, null, 0.10, round(v_net * 0.10, v_round), v_price.currency),
        (v_reg, 'eglise', null, v_church, 0.10, round(v_net * 0.10, v_round), v_price.currency);
    end if;
  else
    -- Décision revue : l'inscription n'est plus due, sauf reversement déjà versé
    delete from public.validated_registrations vr
    where vr.user_id = p_candidate
      and not exists (select 1 from public.reversements r where r.registration_id = vr.id and r.paid_at is not null);
  end if;

  insert into public.notifications (user_id, icon, body, href)
  values (p_candidate, case when p_decision = 'valider' then 'shield' else 'info' end,
          coalesce(nullif(p_message, ''), 'Votre référent a examiné votre demande. Il reprendra contact avec vous.'),
          case when p_decision = 'valider' then '#/paiement' else '#/tableau-de-bord' end);
end;
$$;

-- Intérêt : réciproque si l'autre l'a déjà manifesté. Crée alors la mise en relation
-- (début des 3 mois d'échange), le fil commun et prévient les deux membres.
create function public.api_express_interest(p_me uuid, p_other uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  a uuid := least(p_me, p_other);
  b uuid := greatest(p_me, p_other);
  v_conv uuid;
begin
  if p_me = p_other then raise exception 'interdit' using errcode = '22023'; end if;
  insert into public.interests (from_user, to_user) values (p_me, p_other) on conflict do nothing;
  delete from public.profile_passes where user_id = p_me and passed_user = p_other;
  if not exists (select 1 from public.interests where from_user = p_other and to_user = p_me) then
    insert into public.notifications (user_id, icon, body, href)
    values (p_other, 'heart', 'Un membre a manifesté son intérêt pour votre profil.', '#/interets');
    return 'interet';
  end if;
  if exists (select 1 from public.relations where user_a = a and user_b = b) then return 'relation'; end if;

  insert into public.relations (user_a, user_b) values (a, b);
  insert into public.conversations (user_a, user_b) values (a, b)
    on conflict (user_a, user_b) do update set last_message_at = now()
    returning id into v_conv;
  insert into public.messages (conversation_id, sender_id, body)
  values (v_conv, null, 'Intérêt réciproque ! Vous êtes désormais mis en relation. Prenez le temps de faire connaissance, dans la paix et la prière.');
  return 'relation';
end;
$$;

-- Activation du parcours Cheminant par un membre, après 3 mois d'échange.
-- Le couple n'est créé que lorsque les deux l'ont activé.
create function public.api_activate_cheminant(p_me uuid, p_other uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  r public.relations;
  v_conv uuid;
begin
  select * into r from public.relations where user_a = least(p_me, p_other) and user_b = greatest(p_me, p_other) for update;
  if r.id is null then raise exception 'relation introuvable' using errcode = 'P0002'; end if;
  if r.status = 'couple_en_cheminement' then return 'active'; end if;
  if now() < r.created_at + interval '3 months' then return 'verrouille'; end if;

  if r.user_a = p_me then update public.relations set a_activated_at = coalesce(a_activated_at, now()) where id = r.id returning * into r;
  else update public.relations set b_activated_at = coalesce(b_activated_at, now()) where id = r.id returning * into r; end if;

  if r.a_activated_at is null or r.b_activated_at is null then
    insert into public.notifications (user_id, icon, body, href)
    values (p_other, 'ring', 'Votre mise en relation a activé le parcours Cheminant. À vous de confirmer depuis votre profil.', '#/mon-profil/parcours-cheminant');
    return 'en_attente';
  end if;

  update public.relations set status = 'couple_en_cheminement' where id = r.id;
  select id into v_conv from public.conversations where user_a = r.user_a and user_b = r.user_b;
  if v_conv is not null then
    insert into public.messages (conversation_id, sender_id, body)
    values (v_conv, null, 'Vous avez tous les deux activé le parcours Cheminant. Bienvenue dans l''École du mariage ! Vos référents ont été informés.');
  end if;
  -- Les référents des deux membres sont informés
  insert into public.notifications (user_id, icon, body, href)
  select distinct cr.user_id, 'ring', 'Un couple de votre église est entré dans le parcours Cheminant.', '#/referent/couples'
  from public.member_profiles mp join public.church_referents cr on cr.church_id = mp.church_id
  where mp.user_id in (r.user_a, r.user_b);
  return 'active';
end;
$$;

-- Décision de l'administrateur sur un signalement. Suspension : 2 jours minimum.
-- Désactivation : seulement en cas de récidive (sanction antérieure).
create function public.api_decide_report(p_admin uuid, p_report bigint, p_decision text, p_days int, p_note text)
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
    select 1 from public.member_sanctions where user_id = rep.reported_id and type in ('avertissement', 'suspension')
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

-- Seule l'Edge Function (service_role) appelle ces fonctions
revoke execute on function public.api_decide_candidate(uuid, uuid, public.referent_decision, text, text) from public, anon, authenticated;
revoke execute on function public.api_express_interest(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.api_activate_cheminant(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.api_decide_report(uuid, bigint, text, int, text) from public, anon, authenticated;
grant execute on function public.api_decide_candidate(uuid, uuid, public.referent_decision, text, text) to service_role;
grant execute on function public.api_express_interest(uuid, uuid) to service_role;
grant execute on function public.api_activate_cheminant(uuid, uuid) to service_role;
grant execute on function public.api_decide_report(uuid, bigint, text, int, text) to service_role;

-- ---------- Sécurité : nouvelles tables fermées au navigateur ----------
do $$
declare t text;
begin
  for t in select unnest(array['module_progress', 'course_progress', 'module_notes']) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
