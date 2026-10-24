-- =========================================================
-- CHEMINONS — abonnements Stripe (carte) et PayPal
-- Le membre souscrit sur la page du prestataire, qui renouvelle ensuite la formule
-- chaque mois (SINGLE) ou chaque trimestre (CHEMINONS) jusqu'à sa résiliation.
-- Chaque échéance réglée devient une ligne de payments (provider_ref unique : la même
-- échéance n'est jamais comptée deux fois, qu'elle arrive par webhook ou au retour du membre).
-- =========================================================

-- Abonnement en cours du membre (un seul à la fois : en changer résilie le précédent)
alter table public.member_profiles
  add column subscription_provider text check (subscription_provider in ('stripe', 'paypal')),
  add column subscription_id       text,
  add column subscription_status   text check (subscription_status in ('actif', 'resilie'));
create index member_profiles_subscription on public.member_profiles (subscription_id) where subscription_id is not null;

-- Plans d'abonnement créés chez PayPal (un par formule, région et prix : un nouveau prix crée un nouveau plan)
create table public.provider_plans (
  provider    text not null check (provider in ('paypal')),
  plan        plan_key not null,
  region      billing_region not null,
  currency    char(3) not null,
  amount      numeric(12,2) not null,
  external_id text not null,
  created_at  timestamptz not null default now(),
  primary key (provider, plan, region, currency, amount)
);
alter table public.provider_plans enable row level security;
revoke all on public.provider_plans from anon, authenticated;
