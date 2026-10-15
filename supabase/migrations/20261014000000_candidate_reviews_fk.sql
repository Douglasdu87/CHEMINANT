-- L'espace référent (GET /state) lit member_profiles avec candidate_reviews(...) imbriqué :
-- PostgREST exige une clé étrangère directe entre les deux tables (toutes deux liées à users).
-- Une revue de candidature est toujours créée après le profil (POST /candidates).
alter table public.candidate_reviews
  add constraint candidate_reviews_member_profile_fkey
  foreign key (user_id) references public.member_profiles (user_id) on delete cascade;

notify pgrst, 'reload schema';
