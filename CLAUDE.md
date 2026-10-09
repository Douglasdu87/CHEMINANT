# CLAUDE.md — CHEMINANT

## Le projet

**Cheminant** est une plateforme chrétienne de mise en relation, de discernement et de préparation au mariage.
Particularité : **chaque candidat est validé par un référent de l'église à laquelle il appartient** avant que son profil soit activé.

Inspiration UX : adopte.app (ton direct, grandes typos, parcours simple), mais avec une identité sobre, chaleureuse et chrétienne. Ce n'est **pas** une app de dating classique : on parle de *cheminement*, de *discernement*, d'*intérêt réciproque*, jamais de « match » ou de « swipe ».

## Périmètre

**Frontend uniquement, préparé pour Neon.** Aucune API réelle pour l'instant.
- Les données sont fictives (`js/data.js`).
- L'état de démo (intérêts, progression des modules, décisions du référent…) est conservé dans `localStorage` via `js/store.js`, toujours protégé par `try/catch`.
- Les formulaires ne transmettent rien : ils simulent l'étape suivante.
- Tarifs : `CH_DATA.pricing` et `CH_DATA.plans` dans `js/data.js`. SINGLE = 29 €/mois, CHEMINANT = 80 €/trimestre (7 € de moins que 3 mois de SINGLE) ; Afrique : 19 000 et 52 500 FCFA. La région (donc la devise) vient de l'église de rattachement (`CH.region()`, Europe par défaut).
- Les églises acceptées par l'administrateur (`extraChurches`) s'ajoutent à `CH_DATA.churches` via `CH.allChurches()` : toujours passer par `CH.church()` / `CH.allChurches()`.
- Les notifications de l'espace membre sont calculées par `CH.notifications(state)` (pas stockées) ; seules les notifications lues sont mémorisées (`readNotifs`). `Store.write` émet l'événement `cheminant:change` pour rafraîchir le compteur.
- `Store.resetMember()` réinitialise le membre de démo en conservant le réseau d'églises géré par l'administrateur.
- **Base de données (à venir)** : Neon (PostgreSQL). `js/api.js` est la couche d'accès prévue (mode `demo` / `api` choisi dans `js/config.js`), `db/schema.sql` le schéma, `docs/BACKEND-NEON.md` la marche à suivre. Le code d'accès à la base **ne s'écrit jamais côté navigateur** : `DATABASE_URL` reste sur le serveur. Toute nouvelle opération de données doit être ajoutée à `Api` avec son contrat de route en commentaire.

## Stack

- HTML5 + CSS3 + JavaScript vanilla (scripts classiques, pas d'ES modules) : l'application s'ouvre aussi en `file://`.
- **Application monopage** : un seul document, `index.html`. Routage par ancre dans `js/app.js` :
  `#/<vue>[/<section>][?param=valeur]` — ex. `#/`, `#/accueil/faq`, `#/profil?id=p1`, `#/referent/entretiens`.
- **Aucune étape de build.**
- Polices Google Fonts : *Newsreader* (titres, italiques d'accent) et *Manrope* (texte).
- Pas de framework CSS : un seul fichier `css/style.css` organisé par sections, avec des variables CSS (`:root`).

## Écrire une vue

Chaque écran est un fichier `js/views/<nom>.js`, chargé dans `index.html` :

```js
App.view("nom", {
  layout: "public" | "app" | "referent" | "admin",  // en-tête à afficher
  title: "Titre de l'onglet",
  mainClass: "app-main",          // facultatif
  template: () => `…HTML…`,       // markup de la page (+ ses modales)
  init(ctx) { … }                 // facultatif : logique de la page
});
```

- Liens internes : toujours `href="#/vue"`, jamais `xxx.html` ni `href="#ancre"` seul.
- Paramètres : `CH.param("id")` (ou `ctx.param("id")`).
- Écouteur sur `document` : `App.onDocument("click", …)`, retiré automatiquement en quittant la vue. Minuteries : `ctx.onLeave(() => clearInterval(t))`.
- Les écouteurs posés sur des éléments de la vue n'ont pas besoin de nettoyage (le DOM est remplacé).
- Icônes : `icon("nom", taille)` en JS, ou `<i data-icon="nom"></i>` dans le markup. Jamais d'emoji ni de caractère (✓, ×) en guise d'icône.
- Aspect « fait main » : pas d'icône étincelle, pas de coches décoratives devant les listes (`.checks` = liste à filets fins ; une coche n'indique qu'un état réel : étape terminée, activé…), pas de tiret cadratin dans les textes visibles (utiliser « : », « , » ou « | »).

## Arborescence

```
CHEMINANTS/
├── CLAUDE.md
├── index.html              Document unique : en-tête, zone de vue, pied de page, scripts
├── css/style.css
├── public/logo-cheminant.png   Logo officiel (cœur calligraphié + croix)
├── db/schema.sql           Schéma PostgreSQL pour Neon
├── docs/BACKEND-NEON.md    Guide de branchement de la base
├── .env.example            Variables serveur (jamais de secret dans le dépôt)
└── js/
    ├── config.js           Mode de données (demo | api), adresse de l'API
    ├── data.js             Données fictives (profils, églises, modules, étapes du parcours)
    ├── store.js            État de démo (localStorage) + helpers métier CH
    ├── api.js              Couche d'accès aux données (démo aujourd'hui, Neon demain)
    ├── layout.js           En-tête / pied de page / icônes / toasts / modales
    ├── app.js              Routeur monopage + page 404
    ├── components/profile-card.js
    ├── components/price-card.js       Carte tarifaire (accueil et paiement)
    ├── components/cheminant-gate.js   Progression des 3 mois d'échange
    ├── components/report.js           Signaler un membre + résumé d'un signalement
    └── views/
        ├── accueil.js            #/  — présentation, parcours, modules, FAQ
        ├── transparence.js       #/transparence — compatibilité et profilage
        ├── inscription.js        #/inscription — étapes + église + envoi au référent
        ├── connexion.js          #/connexion — démo : choix du rôle
        ├── tableau-de-bord.js    #/tableau-de-bord
        ├── recherche.js          #/recherche
        ├── profil.js             #/profil?id=…
        ├── interets.js           #/interets
        ├── cheminement.js        #/cheminement?id=…
        ├── paiement.js           #/paiement — choix et règlement de la formule
        ├── messages.js           #/messages?id=… — messagerie entre membres validés et à jour
        ├── ecole.js              #/ecole — École du mariage : cours vidéo et audio, progression
        ├── parcours.js           #/parcours — modules : textes, questionnaires, exercices
        ├── module.js             #/module?id=…
        ├── preparation.js        #/preparation — étapes 13 à 15
        ├── mon-profil.js         #/mon-profil
        ├── referent.js           #/referent — candidats, entretiens, décisions, signalements, mes reversements
        ├── eglise.js             #/eglise — reversements de l'église, #/eglise/referents — ses référents
        ├── eglise-partenaire.js  #/eglise-partenaire
        ├── admin.js              #/admin — dont #/admin/signalements (décisions de modération)
        └── finances.js           #/finances — flux financiers (super administrateur)
```

## Identité visuelle

- Rouge du logo `--color-primary` (#b5191f) réservé aux actions principales et aux accents ; papier ivoire `--color-bg`, encre brune `--color-ink`.
- Ton éditorial : filets fins plutôt qu'ombres, petits titres en italique (`.kicker`), numérotation sobre. Éviter les blobs dégradés, cartes flottantes, chiffres décoratifs inventés et grilles d'icônes génériques.
- Boutons rectangulaires arrondis (`--radius-sm`), cibles tactiles ≥ 44 px.

## Parcours produit (ordre à respecter partout)

1. Inscription → 2. Rattachement à une église → 3. Validation du référent → 4. Profil activé →
5. Recherche / suggestions → 6. Intérêt → 7. Intérêt réciproque → 8. Mise en relation →
9. Temps de discernement (3 mois d'échange) → 10. Décision d'avancer ensemble (activation par chacun) → 11. Entrée dans le parcours Cheminant →
12. École du mariage → 13. Accompagnement → 14. Préparation au mariage → 15. Mariage

Statuts clés :
- Candidat : `en_attente_validation` → `actif`
- Relation : `interet` → `interet_reciproque` → `mise_en_relation` → `couple_en_cheminement`
- Entretien référent : `a_planifier` → `planifie` → `realise`
- Décision référent : `valider` | `refuser` | `demander_infos` | `mettre_en_attente`

## Règles métier à refléter dans l'interface

- **Compatibilité** : un score interne existe, mais l'UI met en avant **5 points de convergence** (forte convergence / convergence / compatible / à discuter) plutôt qu'un pourcentage. Dimensions : Foi, Vision du mariage, Projet familial, Valeurs, Communication, Mode de vie, Projet géographique, Engagement, Attentes relationnelles.
- Le score **ne décide jamais seul** : toujours rappeler qu'une intervention humaine est possible et lier vers `transparence.html`.
- **Paiement (`#/paiement`)** : après la validation du référent, le membre choisit parmi les **quatre cartes** (SINGLE / CHEMINANT, Europe en euros / Afrique en FCFA, composant `price-card.js`) ; le moyen de paiement suit la région de la carte (`CH_DATA.paymentMethods` : Stripe et PayPal en Europe, agrégateur Mobile Money en Afrique), puis il règle sur la page du prestataire (aucune donnée bancaire saisie sur Cheminant). `CH.subscribe()` renseigne `user.paid`, `paidUntil` et l'historique `payments` : la messagerie s'ouvre et le profil devient définitif. Tous les boutons « Régler ma formule » mènent ici.
- **Messagerie (`#/messages`)** : tout membre **validé par son référent et à jour de sa formule** peut écrire à tout autre membre dans la même situation, quel que soit son sexe (`CH.canChat(state)`, `CH.chatEligible(profil)`, `user.paid`). Charte des échanges acceptée avant le premier message, signalement au référent, blocage. Un fil par membre dans `state.messages`, partagé avec « Notre cheminement ».
- **Double intérêt** : l'intérêt réciproque ouvre « Notre cheminement » (discernement), pas la messagerie. La date de mise en relation est enregistrée (`relationSince`).
- **Signalements** : un signalement (Messages ou Notre cheminement, composant `js/components/report.js`) est transmis **au référent** de l'église du membre (avis consultatif, `#/referent/signalements`) **et à l'administrateur**, qui **seul décide** dans `#/admin/signalements` : avertissement, suspension temporaire (**2 jours minimum** selon l'objet, `CH_DATA.moderation`) ou, **en cas de récidive** (sanction déjà prononcée), **désactivation du compte**. Règles : `CH.decideReport()`, `CH.accountStatus()`, `CH.isRecidivist()`. Un compte suspendu ou désactivé disparaît de la recherche et de la messagerie. L'auteur n'est jamais révélé au membre signalé.
- **Trois mois d'échange avant le parcours Cheminant (règle très importante)** : le parcours Cheminant ne peut être activé qu'après **3 mois** d'échange sur la plateforme depuis la mise en relation (`CH_DATA.cheminantDelayMonths`). Ce temps d'épreuve permet aux candidats d'apprendre à se connaître et d'éprouver la relation. Ensuite, **chacun l'active depuis son profil** (`#/mon-profil/parcours-cheminant`) ; il ne s'ouvre (statut `couple_en_cheminement`, École du mariage) que lorsque **les deux** l'ont activé. Règles uniques : `CH.cheminantStatus(state, id)` et `CH.activateCheminant(id)`. Jamais de bouton qui crée le couple directement ; partout ailleurs, afficher la progression (bloc `cheminantGate()`).
- **Référents** : une église désigne **autant de référents qu'elle le souhaite** (`#/eglise/referents`, `Api.church.addReferent`). Liste : `CH_DATA.referents` + `state.extraReferents`, via `CH.allReferents()` / `CH.referentsOf(churchId)` / `CH.referent(id)`. Chaque inscription validée garde son référent (`validatedBy` / `referentId`) ; le référent connecté de la démo est `CH_DATA.demoReferentId`.
- **Reversements** : chaque inscription validée vaut le prix de sa formule. Après déduction des taxes (`taxRate` par région), 10 % du HT revient au référent qui a validé et 10 % à son église (`CH_DATA.reversion`, calcul `CH.reversement()`, arrondi par ligne). **Seul le bénéficiaire voit son montant, et rien d'autre** : le référent dans `#/referent/reversements` voit uniquement sa part sur les inscriptions **qu'il a lui-même validées** (`CH.referentEarnings()`), l'église dans `#/eglise` voit uniquement sa part sur les inscriptions validées par **l'ensemble de ses référents** (`CH.churchEarnings()`). Ni l'un ni l'autre ne voit le prix TTC, le montant HT, la part de l'autre ou celle d'un autre référent. Aucun montant côté membre ni sur l'accueil. Seuls **l'administrateur et le super administrateur** voient tout dans `#/finances` (`CH.ledger()`) : synthèse, répartition (taxes, référents, églises, part Cheminant = HT − 20 %), totaux par église et par référent (plusieurs référents par église), toutes les transactions avec export CSV. Les devises ne sont jamais additionnées : un onglet par devise.
- **École du mariage, cours vidéo et audio (`#/ecole`)** : bouton « École du mariage » dans le menu et sur le tableau de bord du couple. Chaque module = introduction vidéo + un cours par thème (vidéo ou audio, `CH_DATA.courses`). Le module suivant s'ouvre quand le précédent est suivi en entier (`CH.courseUnlocked`). Progression **par conjoint** (`state.courses.me / partner`, `CH.courseGlobal`), visible : tableau de bord du couple, `#/referent/couples` (couples de son église, assiduité), `#/admin/ecole` (tous les couples). Assiduité : `CH.assiduity()` d'après la dernière activité. `#/parcours` garde textes, questionnaires et exercices.
- **École du mariage = module à activer** : réservée aux couples entrés dans le parcours Cheminant (étape 11, après les 3 mois d'échange et l'activation par chacun). Règle unique : `CH.schoolActive(state)`. Avant activation : pas d'entrée dans le menu, `#/parcours` affiche un écran verrouillé, `#/module` redirige, et l'accueil public présente le principe sans le contenu des cours.
- Actions sur un profil : consulter, manifester son intérêt, passer, demander un accompagnement.
- **Décision négative du référent** : formulation prudente, motif interne jamais exposé au candidat ; message neutre côté membre.
- Modules 5 (intimité) et contenus spécialisés : mention « contenus élaborés avec des responsables pastoraux et des professionnels compétents ».

## Conventions

- Langue de l'interface : **français**, vouvoiement.
- Vocabulaire : « cheminement », « discernement », « intérêt », « mise en relation », « référent ». Éviter « match », « like », « swipe », « crush ».
- Classes CSS en kebab-case, approche BEM légère (`.card`, `.card__title`, `.card--muted`).
- Couleurs uniquement via variables `--color-*` de `:root`.
- Responsive mobile d'abord ; aucune barre de défilement horizontale à 375 px.
- Accessibilité : contrastes AA, `alt` sur les images, `aria-label` sur les boutons-icônes, focus visible, labels sur tous les champs.
- Avatars : initiales sur fond dégradé (pas de photos réelles — respect de la vie privée).

## Lancer le projet

Depuis le terminal, dans le dossier du projet (Node.js requis) :

```bash
npm start
```

Le site s'ouvre sur http://localhost:5173 (commande définie dans `package.json`). On peut aussi ouvrir `index.html` directement dans un navigateur.

Pour réinitialiser la démo : bouton « Réinitialiser la démo » dans le pied de page (vide le `localStorage`).
