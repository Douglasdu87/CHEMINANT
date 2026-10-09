/* =========================================================
   CHEMINANT — configuration
   dataSource :
     "demo" → données fictives + localStorage (aucun serveur)
     "api"  → API serveur reliée à la base Neon (voir docs/BACKEND-NEON.md)
   Ne JAMAIS placer ici l'URL de connexion à la base (DATABASE_URL) :
   ce fichier est public, la connexion à Neon se fait côté serveur.
   ========================================================= */

const CH_CONFIG = Object.freeze({
  dataSource: "demo",
  apiBaseUrl: "/api",
  requestTimeoutMs: 15000
});
