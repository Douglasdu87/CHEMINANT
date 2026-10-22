-- Demandes de partenariat : adresse de l'église et date de création
-- (église, cellule ou maison d'honneur)
alter table public.church_requests
  add column address    text,
  add column founded_on date check (founded_on >= date '1800-01-01');
