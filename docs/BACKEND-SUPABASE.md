# Cheminons sur Supabase

L'application fonctionne sur Supabase (projet **saascheminant**, `wubiwhyiyzhvfnuhmiqc`, région eu-west-1, organisation « cheminant »). Le mode démo reste disponible (`dataSource: "demo"` dans `js/config.js`).

## Architecture

| Élément | Fichier | Rôle |
|---|---|---|
| Interrupteur | `js/config.js` | `dataSource: "supabase"` ou `"demo"`, URL du projet, clé publishable, fréquence de rechargement |
| Session et état | `js/remote.js` | Démarrage (session, retour des liens reçus par e-mail), `GET /state`, `Remote.push`, rechargement toutes les 15 s, inscription en attente de confirmation |
| Couche d'accès | `js/api.js` | Toutes les opérations, avec le contrat de chaque route en commentaire |
| Schéma | `supabase/migrations/*.sql` | Tables (RLS partout, sans politique), fonctions métier `api_*` (transactionnelles, `service_role` seulement) |
| Données de départ | `supabase/seed.sql` | 10 églises, 4 tarifs |
| Serveur | `supabase/functions/api/index.ts` | Toutes les routes ; contrôle du rôle et du périmètre de chaque compte |
| Secrets | `.env.example` | `ALLOWED_ORIGIN`, `SITE_URL`, `PAYMENT_MODE` |

**`GET /state`** renvoie, pour le compte connecté, un état de la même forme que l'état de démo (`js/store.js`), filtré par le serveur : un membre reçoit les profils validés (avec les 5 points de convergence, jamais le score), ses intérêts, ses fils de messages, sa progression ; un référent, les candidats et signalements de son église et **sa** part des reversements ; une église, **sa** part ; l'administrateur, tout (grand livre, signalements, demandes de partenariat). Les écrans gardent donc leur logique, et chaque action passe par une route qui applique les règles métier.

**Messages** : pas de temps réel Supabase (les tables sont fermées au navigateur) ; les nouveaux messages arrivent par le rechargement de l'état (15 s). Pour du temps réel, il faudra un canal Realtime « broadcast » émis par l'Edge Function.


## Règle de sécurité n° 1

**La clé `service_role` et la chaîne de connexion PostgreSQL ne doivent jamais se trouver dans le navigateur.**
Elles contournent toutes les protections : toute personne qui ouvrirait le code de la page pourrait lire, modifier ou supprimer toutes les données des membres.

La clé `anon` (ou `publishable`) de `js/config.js` est publique par nature. Elle ne protège rien à elle seule : c'est pourquoi **toutes les tables ont la RLS activée sans aucune politique** et des droits retirés aux rôles `anon` et `authenticated`. L'API REST automatique de Supabase ne renvoie donc rien au navigateur. Le schéma est toujours le suivant :

```
Navigateur (ce projet)  →  Edge Function « api »         →  Base Supabase
     js/api.js               supabase/functions/api          PostgreSQL (RLS)
     Supabase Auth           clé service_role + règles
```

Si, plus tard, une table doit être lue directement depuis le navigateur (messagerie en temps réel par exemple), écrire pour elle une politique RLS précise (`auth.uid()`) et la faire relire avant de l'ouvrir.

## État au 11 octobre 2026

Fait :
- Schéma, fonctions métier et données de départ appliqués (migrations `20261010…`, `20261011…`, `20261012…`).
- Edge Function `api` déployée (version 2, vérification du jeton faite par la fonction).
- Frontend branché : inscription (Supabase Auth + candidature), connexion, mot de passe oublié, invitation des référents et des églises par e-mail, validation par le référent (entretien, décision, reversements calculés en base), messagerie (charte, réactions, blocage, signalement), intérêts et mise en relation, Notre cheminement, activation du parcours après 3 mois, École du mariage, parcours, préparation au mariage, paiement (mode simulation), espaces référent, église et administrateur, export des données (RGPD).
- Vérifié : routes publiques et refus sans session, protection des espaces par rôle, mode démo intact, affichage à 375 px, avis de sécurité Supabase.

Pas encore vérifié de bout en bout avec de vrais comptes (inscription → validation → messagerie entre deux membres) : voir « Tester ».

## Ce qu'il vous reste à faire

1. **Authentication → URL Configuration** : *Site URL* = l'adresse du site (aujourd'hui `http://localhost:5173`), et dans *Redirect URLs* : `http://localhost:5173/**` (plus l'adresse de production le moment venu). Pour le navigateur, `http://localhost:5173` et `http://127.0.0.1:5173` sont deux origines différentes : `npm start` ouvre `localhost`, et l'Edge Function accepte les deux par défaut (`ALLOWED_ORIGIN` accepte plusieurs adresses séparées par des virgules).
2. **Authentication → Providers → Email** : confirmation de l'adresse e-mail activée, mot de passe de 8 caractères minimum.
3. **Authentication → SMTP Settings** : brancher un vrai service d'e-mail (Brevo, Resend, Postmark…). Le service intégré de Supabase n'envoie que quelques e-mails par heure : insuffisant pour les confirmations et les invitations.
4. **Créer le compte administrateur** : Authentication → Users → *Add user* (avec votre adresse), puis demander à Claude de lui donner le rôle `admin` (`update public.users set role = 'admin' where email = '…'`).
5. **Rattacher un référent aux églises de départ** : depuis l'espace administrateur, « Ajouter un référent » (nom, e-mail, église). Il reçoit une invitation et choisit son mot de passe sur `#/mot-de-passe`.
6. **Paiement** : `PAYMENT_MODE` vaut `simulation` (le règlement est enregistré sans prestataire). Avant l'ouverture au public : brancher Stripe Checkout (+ PayPal) et un agrégateur Mobile Money, avec un webhook signé qui appelle `recordPayment`, puis passer `PAYMENT_MODE` à une autre valeur.
7. **Mise en ligne** : héberger le dossier (Netlify, Vercel, Cloudflare Pages…), puis `supabase secrets set ALLOWED_ORIGIN=https://… SITE_URL=https://…` et ajouter l'adresse dans les *Redirect URLs*. Poser les en-têtes HTTP listés plus bas.
8. **RGPD** : case de consentement explicite au traitement des convictions religieuses, purge des comptes dont la suppression est demandée (`users.deletion_requested_at`), validation par un juriste.

## Tester

Avec deux navigateurs (ou une fenêtre privée) : inscrire deux membres de sexe opposé dans la même église, valider les deux depuis l'espace du référent, régler la formule (simulation), manifester l'intérêt de part et d'autre, puis échanger des messages. Pour tester l'activation du parcours sans attendre trois mois, vieillir la relation en SQL : `update relations set created_at = now() - interval '95 days' where …`.


## Règles métier que le serveur doit garantir

Ces règles sont aujourd'hui simulées par le frontend. Une fois en production, c'est le serveur qui doit les faire respecter, car un navigateur peut être manipulé.

- **Le score de compatibilité n'est jamais envoyé au navigateur.** L'API renvoie seulement les 5 points de convergence (`forte`, `convergence`, `compatible`, `discuter`).
- **Messagerie réservée aux membres validés et à jour de leur formule.** Toutes les routes `/conversations` répondent `403` si l'un des deux membres n'est pas au statut `actif`, si sa formule n'est pas réglée (`member_profiles.paid_until` dépassé ou vide), ou si l'un a bloqué l'autre (`member_blocks`). Les signalements (`member_reports`) sont transmis au référent du signalant.
- **L'intérêt réciproque ouvre « Notre cheminement »** (discernement) ; il n'est plus requis pour échanger des messages.
- **Signalements et sanctions.** `POST /reports` enregistre le signalement (`member_reports`) et le notifie au référent de l'église du signalant et à l'administrateur. Le référent ne voit que les signalements impliquant un membre de son église et ne peut que donner un avis (`referent_note`). Seul l'administrateur décide (`POST /admin/reports/:id/decision`) : avertissement, suspension (2 jours minimum, `member_sanctions.ends_at`) ou désactivation, refusée (`422`) si le membre n'a aucune sanction antérieure. Un compte suspendu ou désactivé est exclu de la recherche et de la messagerie (`403`). L'auteur d'un signalement n'est jamais révélé au membre signalé.
- **Trois mois d'échange avant le parcours Cheminons.** `POST /relations/:id/advance` répond `403` tant que `relations.created_at + interval '3 months'` n'est pas atteint. Chaque membre active le parcours pour lui-même (`a_activated_at` / `b_activated_at`) ; le serveur ne passe la relation au statut `couple_en_cheminement` (et n'ouvre l'École du mariage) que lorsque les deux colonnes sont renseignées, puis informe les deux référents.
- **Le motif interne d'un refus (`internal_note`) n'est jamais renvoyé au candidat.**
- **Un référent ne voit que les candidats de son église.**
- **Un profil n'est visible qu'au statut `actif`.**
- **Reversements.** Quand un référent valide une candidature, le serveur crée une ligne dans `validated_registrations` au prix TTC de la formule choisie (SINGLE ou CHEMINONS, selon la région de l'église). Il déduit ensuite les taxes, puis crée deux lignes dans `reversements` : 10 % du montant HT pour le référent, 10 % pour son église. Ce calcul se fait **uniquement côté serveur**.
- **Confidentialité des reversements.** `GET /referent/reversements` ne renvoie que les lignes du référent connecté, et `GET /church/reversements` que celles de l'église du compte connecté. Un membre ne voit jamais ces montants, et un référent ne voit pas la part de son église.
- **Comptes et mots de passe** : gérés par Supabase Auth (hachage, jetons, réinitialisation). Le rôle d'un compte vient uniquement de `public.users.role` ; le déclencheur `on_auth_user_created` crée toujours un « membre », quelles que soient les métadonnées envoyées.
- **Validation des saisies** : le serveur revalide chaque champ (types, longueurs, caractères de balisage) même si l'interface le fait déjà (`CH.clean`) ; l'interface échappe à l'affichage (`CH.escape`), mais une donnée stockée ne doit jamais être considérée comme sûre.
- **Autorisations** : les rôles de la page `#/connexion` sont une démo. Chaque route vérifie côté serveur le rôle et le périmètre (membre, référent de son église, église, administrateur) ; masquer un écran dans l'interface ne protège rien.
- **En-têtes HTTP** : posés par `vercel.json` (CSP sans script en ligne ni script tiers, `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). supabase-js est servi depuis `js/vendor/` (copie identique au paquet npm) et le démarrage est dans `js/start.js`. Tout nouveau domaine (images, vidéos, API) doit être ajouté à la CSP.
- **Comptes sanctionnés** : `GET /state` ne renvoie plus ni profils, ni photos, ni messages à un compte suspendu ou désactivé ; une désactivation bloque aussi la connexion (Supabase Auth, `ban_duration`).
- **Suppression de compte** : le profil disparaît dès la demande ; l'administrateur l'exécute dans `#/admin` (`POST /admin/members/:id/purge`, fonction `api_purge_user`) : photos, profil, échanges et progression effacés, compte pseudonymisé et fermé ; paiements, reversements et signalements conservés.
- **Limites de débit** : table `rate_events` (photos, intérêts, demandes d'accompagnement, demandes de partenariat par adresse IP) ; un signalement exige un compte validé et un échange avec la personne signalée.
- **Consentement RGPD art. 9** : case obligatoire à l'inscription, horodatée dans `member_profiles.sensitive_consent_at` ; politique de confidentialité sur `#/confidentialite` (à faire valider par un juriste).
- **Limitation de débit** sur la connexion, l'inscription, les messages et les signalements (Supabase Auth limite déjà la connexion et l'inscription ; l'Edge Function doit limiter les messages et les signalements). Le jeton circule dans l'en-tête `Authorization`, pas dans un cookie : pas de CSRF, mais `ALLOWED_ORIGIN` doit être l'adresse exacte du site.

## Données personnelles (RGPD)

Les convictions religieuses sont des **données sensibles** au sens de l'article 9 du RGPD. Il faudra :
- ajouter à l'étape « Engagement » de l'inscription une case de consentement explicite au traitement des convictions religieuses (les trois cases actuelles concernent la charte, le référent et la compatibilité, pas celui-ci) ;
- héberger les données dans l'Union européenne ;
- prévoir l'export et la suppression du compte (les boutons existent déjà dans « Mon profil ») ;
- faire valider ces points par un juriste avant l'ouverture au public.
