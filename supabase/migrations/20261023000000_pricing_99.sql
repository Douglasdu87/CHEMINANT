-- Nouveaux tarifs TTC (CH_DATA.pricing) : Europe 29,99 € / 79,99 € ; Afrique 19 490 / 52 490 FCFA.
-- Les inscriptions déjà validées et les paiements passés gardent leur montant d'origine.
update public.plan_prices set amount_ttc = 29.99 where region = 'europe'  and plan = 'single';
update public.plan_prices set amount_ttc = 79.99 where region = 'europe'  and plan = 'cheminant';
update public.plan_prices set amount_ttc = 19490 where region = 'afrique' and plan = 'single';
update public.plan_prices set amount_ttc = 52490 where region = 'afrique' and plan = 'cheminant';
