/* =========================================================
   CHEMINONS — configuration
   dataSource :
     "demo"     → données fictives + localStorage (aucun serveur)
     "supabase" → Supabase Auth + Edge Function « api » (voir docs/BACKEND-SUPABASE.md)
   supabaseUrl et supabaseAnonKey sont publics par nature (clé « anon » /
   « publishable ») : la protection repose sur la RLS et l'Edge Function.
   Ne JAMAIS placer ici la clé service_role ni la chaîne de connexion
   PostgreSQL : elles restent côté serveur (secrets Supabase).
   ========================================================= */

const CH_CONFIG = Object.freeze({
  dataSource: "supabase",
  supabaseUrl: "https://wubiwhyiyzhvfnuhmiqc.supabase.co",
  supabaseAnonKey: "sb_publishable_a3lCusfSvRCwinjsQlu0TQ_BZJF7I29",   // clé publishable (publique)
  // Copie locale de supabase-js (identique au paquet npm officiel) : aucun script tiers chargé à l'exécution
  supabaseJsUrl: "js/vendor/supabase-2.45.4.js",
  requestTimeoutMs: 15000,
  pollMs: 15000             // rechargement de l'état (nouveaux messages, décisions)
});
