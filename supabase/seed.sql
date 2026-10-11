-- =========================================================
-- CHEMINANT — données de départ (reprend js/data.js)
-- Églises de démo et tarifs. Chargé par « supabase db reset » en local,
-- ou collé une fois dans l'éditeur SQL du tableau de bord.
-- =========================================================

insert into public.churches (name, city, denomination, region) values
  ('Église Évangélique de la Croix-Rousse', 'Lyon',      'Évangélique',  'europe'),
  ('Paroisse Saint-Jean-Baptiste',          'Paris 15e', 'Catholique',   'europe'),
  ('Église Protestante Unie du Marais',     'Paris 4e',  'Protestante',  'europe'),
  ('Centre Chrétien Béthel',                'Marseille', 'Pentecôtiste', 'europe'),
  ('Église Baptiste du Centre',             'Bordeaux',  'Baptiste',     'europe'),
  ('Assemblée de Dieu de Lille',            'Lille',     'Pentecôtiste', 'europe'),
  ('Paroisse Notre-Dame-des-Champs',        'Nantes',    'Catholique',   'europe'),
  ('Église Vie et Lumière',                 'Toulouse',  'Évangélique',  'europe'),
  ('Église Évangélique de Cocody',          'Abidjan',   'Évangélique',  'afrique'),
  ('Assemblée Chrétienne de Dakar',         'Dakar',     'Pentecôtiste', 'afrique');

-- Prix TTC (CH_DATA.pricing). Afrique : taux de taxe PROVISOIRE, variable selon le pays.
insert into public.plan_prices (region, plan, currency, amount_ttc, tax_rate, months) values
  ('europe',  'single',    'EUR',    29, 0.2000, 1),
  ('europe',  'cheminant', 'EUR',    80, 0.2000, 3),
  ('afrique', 'single',    'XOF', 19000, 0.1800, 1),
  ('afrique', 'cheminant', 'XOF', 52500, 0.1800, 3);
