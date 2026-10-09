# Brancher Cheminant sur Neon

Ce document explique ce qui est déjà prêt dans le frontend et ce qu'il restera à faire le jour où la base de données Neon sera branchée. Aujourd'hui, l'application fonctionne entièrement en **mode démo** : aucune donnée ne quitte le navigateur.

## Ce qui est prêt

| Élément | Fichier | Rôle |
|---|---|---|
| Interrupteur démo / réel | `js/config.js` | `dataSource: "demo"` ou `"api"`, et l'adresse de l'API (`apiBaseUrl`) |
| Couche d'accès aux données | `js/api.js` | Toutes les opérations (connexion, profils, intérêts, messages, École du mariage, référent, administration). En mode démo, elles lisent et écrivent dans le `localStorage` ; en mode `api`, elles appellent le serveur. |
| Schéma de la base | `db/schema.sql` | Les tables PostgreSQL à créer dans Neon, avec les mêmes statuts que l'interface |
| Modèle de variables secrètes | `.env.example` | Les variables à renseigner **sur le serveur** |

## Règle de sécurité n° 1

**L'adresse de connexion Neon (`DATABASE_URL`) ne doit jamais se trouver dans le navigateur.**
Elle contient un mot de passe. Toute personne qui ouvrirait le code de la page pourrait lire, modifier ou supprimer toutes les données des membres.

Le schéma est donc toujours le suivant :

```
Navigateur (ce projet)  →  API serveur (à créer)  →  Base Neon
     js/api.js               fonctions /api/...         PostgreSQL
```

## Les étapes, le moment venu

1. **Créer le projet Neon** sur console.neon.tech (région Europe, par exemple Francfort, pour rester dans l'UE au titre du RGPD).
2. **Créer les tables** : ouvrir l'éditeur SQL de Neon, coller le contenu de `db/schema.sql`, puis l'exécuter.
3. **Créer l'API serveur.** Le plus simple : des fonctions serverless hébergées au même endroit que le site (Vercel, Netlify ou Cloudflare), qui utilisent le pilote `@neondatabase/serverless`. Chaque route de `js/api.js` porte en commentaire son contrat : méthode, adresse, données envoyées et données reçues.
4. **Renseigner les secrets** (`DATABASE_URL`, `SESSION_SECRET`) dans les variables d'environnement de l'hébergeur, jamais dans un fichier du dépôt.
5. **Basculer** `dataSource` sur `"api"` dans `js/config.js`.
6. **Migrer les vues une à une** : les vues (`js/views/*.js`) lisent encore `Store` et `CH` directement. On remplace progressivement ces appels par `await Api.…`, en commençant par la connexion et l'inscription.

## Règles métier que le serveur doit garantir

Ces règles sont aujourd'hui simulées par le frontend. Une fois en production, c'est le serveur qui doit les faire respecter, car un navigateur peut être manipulé.

- **Le score de compatibilité n'est jamais envoyé au navigateur.** L'API renvoie seulement les 5 points de convergence (`forte`, `convergence`, `compatible`, `discuter`).
- **Messagerie réservée aux membres validés et à jour de leur formule.** Toutes les routes `/conversations` répondent `403` si l'un des deux membres n'est pas au statut `actif`, si sa formule n'est pas réglée (`member_profiles.paid_until` dépassé ou vide), ou si l'un a bloqué l'autre (`member_blocks`). Les signalements (`member_reports`) sont transmis au référent du signalant.
- **L'intérêt réciproque ouvre « Notre cheminement »** (discernement) ; il n'est plus requis pour échanger des messages.
- **Signalements et sanctions.** `POST /reports` enregistre le signalement (`member_reports`) et le notifie au référent de l'église du signalant et à l'administrateur. Le référent ne voit que les signalements impliquant un membre de son église et ne peut que donner un avis (`referent_note`). Seul l'administrateur décide (`POST /admin/reports/:id/decision`) : avertissement, suspension (2 jours minimum, `member_sanctions.ends_at`) ou désactivation, refusée (`422`) si le membre n'a aucune sanction antérieure. Un compte suspendu ou désactivé est exclu de la recherche et de la messagerie (`403`). L'auteur d'un signalement n'est jamais révélé au membre signalé.
- **Trois mois d'échange avant le parcours Cheminant.** `POST /relations/:id/advance` répond `403` tant que `relations.created_at + interval '3 months'` n'est pas atteint. Chaque membre active le parcours pour lui-même (`a_activated_at` / `b_activated_at`) ; le serveur ne passe la relation au statut `couple_en_cheminement` (et n'ouvre l'École du mariage) que lorsque les deux colonnes sont renseignées, puis informe les deux référents.
- **Le motif interne d'un refus (`internal_note`) n'est jamais renvoyé au candidat.**
- **Un référent ne voit que les candidats de son église.**
- **Un profil n'est visible qu'au statut `actif`.**
- **Reversements.** Quand un référent valide une candidature, le serveur crée une ligne dans `validated_registrations` au prix TTC de la formule choisie (SINGLE ou CHEMINANT, selon la région de l'église). Il déduit ensuite les taxes, puis crée deux lignes dans `reversements` : 10 % du montant HT pour le référent, 10 % pour son église. Ce calcul se fait **uniquement côté serveur**.
- **Confidentialité des reversements.** `GET /referent/reversements` ne renvoie que les lignes du référent connecté, et `GET /church/reversements` que celles de l'église du compte connecté. Un membre ne voit jamais ces montants, et un référent ne voit pas la part de son église.
- **Mots de passe** : stockés uniquement sous forme de hachage (argon2id ou bcrypt), avec une session portée par un cookie `httpOnly`, `Secure` et `SameSite=Lax`.

## Données personnelles (RGPD)

Les convictions religieuses sont des **données sensibles** au sens de l'article 9 du RGPD. Il faudra :
- ajouter à l'étape « Engagement » de l'inscription une case de consentement explicite au traitement des convictions religieuses (les trois cases actuelles concernent la charte, le référent et la compatibilité, pas celui-ci) ;
- héberger les données dans l'Union européenne ;
- prévoir l'export et la suppression du compte (les boutons existent déjà dans « Mon profil ») ;
- faire valider ces points par un juriste avant l'ouverture au public.
