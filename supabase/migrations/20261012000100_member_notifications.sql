-- Les notifications « intérêt reçu » et « activation du parcours par l'autre membre »
-- sont calculées par l'interface (CH.notifications, avec le prénom) : le serveur ne
-- les enregistre plus, pour éviter les doublons.
create or replace function public.api_express_interest(p_me uuid, p_other uuid)
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

create or replace function public.api_activate_cheminant(p_me uuid, p_other uuid)
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
