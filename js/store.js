/* =========================================================
   CHEMINONS — état de l'application et règles métier (CH)
   Mode démo     : état fictif conservé dans le localStorage.
   Mode supabase : état du compte connecté chargé par GET /state (js/remote.js),
                   gardé en mémoire ; chaque action part vers le serveur.
   ========================================================= */

const STORE_KEY = "cheminant-demo-v1";

/* Horodatage ISO « il y a n minutes » pour les données de démo */
function ago(minutes) { return new Date(Date.now() - minutes * 60000).toISOString(); }

function defaultState() {
  return {
    user: {
      firstName: "Samuel", lastName: "Kabongo", gender: "M", age: 31, city: "Lyon",
      churchId: "c1", status: "actif", candidateId: "k1", colors: ["#3d7a5a", "#2f5f8a"],
      paid: true // formule réglée : donne accès à la messagerie
    },
    interests: { p1: "relation", p3: "interet" }, // statut de la relation par profil
    passed: [],
    accompaniment: [],
    /* Fils de messages par membre (messagerie et « Notre cheminement » partagent le même fil) */
    messages: {
      p1: [
        { from: "system", text: "Intérêt réciproque ! Vous êtes désormais mis en relation. Prenez le temps de faire connaissance, dans la paix et la prière.", time: "1 oct.", ts: ago(7 * 1440 + 300) },
        { from: "them", text: "Bonjour Samuel, je suis contente que nous puissions échanger. J'ai vu que vous serviez à l'accueil vous aussi !", time: "1 oct.", ts: ago(7 * 1440 + 280) },
        { from: "me", text: "Bonjour Rebecca ! Oui, depuis 2019. C'est un service que j'aime beaucoup. Comment avez-vous commencé ?", time: "2 oct.", ts: ago(6 * 1440 + 600) }
      ],
      p9: [
        { from: "them", text: "Bonjour Samuel ! Nous organisons un temps de louange inter-églises à Lyon le 18 octobre. Seriez-vous partant pour venir servir avec nous ?", ts: ago(3 * 1440 + 200) },
        { from: "me", text: "Avec joie ! Je joue un peu de guitare, si cela peut aider.", ts: ago(3 * 1440 + 150) },
        { from: "them", text: "Parfait, je vous ajoute à l'équipe. Répétition le jeudi soir, je vous envoie les chants ici.", ts: ago(3 * 1440 + 140), react: "amen" }
      ],
      p2: [
        { from: "me", text: "Bonjour Esther, votre engagement dans l'étude biblique m'a interpellé. Quel livre étudiez-vous en ce moment ?", ts: ago(2 * 1440 + 90) },
        { from: "them", text: "Bonjour Samuel ! Nous lisons l'épître aux Philippiens : un vrai trésor sur la joie dans toutes les circonstances.", ts: ago(2 * 1440 + 30) },
        { from: "them", text: "Et vous, auriez-vous un livre chrétien à me conseiller pour l'automne ?", ts: ago(40) }
      ],
      p5: [
        { from: "them", text: "Bonjour Samuel, je vois que nous sommes tous les deux engagés dans le service. Comment vivez-vous cet engagement au quotidien ?", ts: ago(130) }
      ]
    },
    /* Date de mise en relation (début des 3 mois d'échange) et activations du parcours Cheminons */
    relationSince: { p1: ago(7 * 1440 + 300) },
    cheminantConsent: {},                 // { p1: { me: ISO | null, them: ISO | null } }
    chatRead: { p1: 3, p9: 3, p2: 2 },
    /* Signalements (transmis au référent et à l'administrateur) et sanctions décidées par l'administrateur */
    reports: [
      {
        id: "sg1", reporter: "p3", reportedId: "p11", reason: "Insistance malgré un refus", context: "Messagerie",
        details: "Après lui avoir dit que je ne souhaitais pas poursuivre, il continue de m'écrire plusieurs fois par jour.",
        excerpt: ["Pourquoi ne répondez-vous plus ?", "Je vous ai écrit trois fois aujourd'hui, j'attends une réponse."],
        date: ago(1 * 1440 + 200), status: "nouveau", referentNote: ""
      },
      {
        id: "sg2", reporter: "p4", reportedId: "p10", reason: "Propos irrespectueux ou déplacés", context: "Messagerie",
        details: "Remarques moqueuses sur ma paroisse.", excerpt: ["Votre paroisse, c'est un club de retraités, non ?"],
        date: ago(300), status: "nouveau", referentNote: ""
      }
    ],
    sanctions: {
      p11: [{ type: "avertissement", date: ago(40 * 1440), reportId: "sg0", note: "Messages insistants envers une autre membre." }]
    },   // nombre de messages lus par fil
    blocked: [],
    chatCharter: false,                   // charte des échanges acceptée
    chatPing: false,                      // message spontané de la démo déjà reçu
    discernment: { p1: [0, 1] },
    modules: { 1: [0, 1, 2, 3, 4, 5], 2: [0, 1] },
    /* Cours vidéo et audio suivis, par conjoint : { [moduleId]: index des cours suivis } */
    courses: { me: {}, partner: {}, lastAt: { me: null, partner: null } },
    candidates: { k1: { interview: "realise", decision: "valider", validatedAt: "2026-10-02" } },
    coupleWith: null,
    prep: { sessions: [], tasks: [], weddingDate: "", married: false },
    settings: { suggestions: true, paused: false },
    readNotifs: [],
    partnerRequests: [
      { id: "r1", church: "Église Adventiste de Rennes", city: "Rennes", address: "12 rue de Brest, 35000 Rennes", founded: "1987-09-13", denomination: "Adventiste", contact: "Pasteur Marc Leroy", referent: "Sœur Agnès Hervé", members: "150 à 500", date: "2 oct. 2026", status: "nouvelle" },
      { id: "r2", church: "Communauté Chrétienne La Source", city: "Strasbourg", address: "4 quai des Bateliers, 67000 Strasbourg", founded: "2009-03-01", denomination: "Évangélique", contact: "Pasteure Léa Muller", referent: "Pasteure Léa Muller", members: "50 à 150", date: "27 sept. 2026", status: "nouvelle" }
    ],
    extraChurches: [],
    extraReferents: [],
    /* Églises et référents de départ retirés par l'administrateur ou l'église (démo) */
    removedChurches: [],
    removedReferents: []
  };
}

/* État vide (mode supabase, avant connexion) : mêmes clés que l'état de démo */
function emptyState() {
  return Object.assign(defaultState(), {
    user: { firstName: "", lastName: "", status: "en_attente_validation", churchId: null, colors: ["#3d7a5a", "#2f5f8a"], paid: false },
    interests: {}, messages: {}, relationSince: {}, chatRead: {}, reports: [], sanctions: {}, discernment: {},
    modules: {}, candidates: {}, partnerRequests: [], payments: [], inbox: [], notes: {}, chatPing: true
  });
}

const Store = {
  read() {
    if (Remote.on) return JSON.parse(JSON.stringify(Remote.state || emptyState()));
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* stockage indisponible : on retombe sur l'état par défaut */ }
    return defaultState();
  },
  write(state) {
    if (Remote.on) Remote.state = state;   // affichage immédiat ; le serveur fait foi au rechargement
    else try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
    document.dispatchEvent(new Event("cheminant:change"));
  },
  update(fn) {
    const s = this.read();
    fn(s);
    this.write(s);
    return s;
  },
  reset() {
    if (Remote.on) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignoré */ }
  },
  /* Réinitialise le membre de démo en gardant le réseau d'églises géré par l'administrateur */
  resetMember() {
    const keep = this.read();
    this.reset();
    this.update(s => {
      s.extraChurches = keep.extraChurches;
      s.extraReferents = keep.extraReferents;
      s.removedChurches = keep.removedChurches;
      s.removedReferents = keep.removedReferents;
      s.partnerRequests = keep.partnerRequests;
      s.reports = keep.reports;
      s.sanctions = keep.sanctions;
    });
  }
};

/* ---------- Helpers métier ---------- */
const CH = {
  profile(id) { return CH_DATA.profiles.find(p => p.id === id); },
  /* Églises de base + églises acceptées par l'administrateur */
  allChurches(state = Store.read()) {
    const removed = state.removedChurches || [];
    return CH_DATA.churches.concat(state.extraChurches || []).filter(c => !removed.includes(c.id));
  },
  church(id) { return this.allChurches().find(c => c.id === id); },
  /* Référents du réseau : ceux de la démo + ceux créés par les églises ou l'administrateur
     (state.extraReferents). Une église peut en désigner autant qu'elle le souhaite. */
  allReferents(state = Store.read()) {
    const removed = state.removedReferents || [];
    return CH_DATA.referents.concat((state.extraReferents || []).map((r, i) => ({ id: r.id || `xr-${i}`, ...r })))
      .filter(r => !removed.includes(r.id));
  },
  /* Démo : retirer un référent ou une église (en mode supabase, le serveur fait foi) */
  removeReferent(id) {
    Store.update(s => {
      s.extraReferents = (s.extraReferents || []).filter(r => r.id !== id);
      if (CH_DATA.referents.some(r => r.id === id)) s.removedReferents = [...new Set((s.removedReferents || []).concat(id))];
    });
  },
  removeChurch(id) {
    Store.update(s => {
      s.extraChurches = (s.extraChurches || []).filter(c => c.id !== id);
      s.extraReferents = (s.extraReferents || []).filter(r => r.churchId !== id);
      if (CH_DATA.churches.some(c => c.id === id)) s.removedChurches = [...new Set((s.removedChurches || []).concat(id))];
      const refs = CH_DATA.referents.filter(r => r.churchId === id).map(r => r.id);
      s.removedReferents = [...new Set((s.removedReferents || []).concat(refs))];
    });
  },
  referentsOf(churchId, state = Store.read()) { return this.allReferents(state).filter(r => r.churchId === churchId); },
  referent(id, state = Store.read()) { return this.allReferents(state).find(r => r.id === id); },
  module(id) { return CH_DATA.modules.find(m => m.id === Number(id)); },

  /* Compte connecté d'un espace référent ou église : { name, churchId } */
  staff(state = Store.read()) {
    if (Remote.on) return { name: state.user.name || `${state.user.firstName} ${state.user.lastName}`.trim(), churchId: state.user.churchId };
    return { name: this.referent(CH_DATA.demoReferentId, state)?.name || "", churchId: "c1" };
  },

  /* Profils visibles : sexe opposé, hors profils passés et profils en pause */
  visibleProfiles(state) {
    const target = state.user.gender === "F" ? "M" : "F";
    return CH_DATA.profiles.filter(p => p.gender === target && !p.paused && !state.passed.includes(p.id) && this.accountStatus(p.id, state).active);
  },

  /* Manifester son intérêt : réciproque si l'autre personne l'a déjà fait */
  expressInterest(id) {
    const p = this.profile(id);
    let result = "interet";
    Store.update(s => {
      if (p.receivedInterest) {
        result = "relation";
        s.interests[id] = "relation";
        s.relationSince[id] = s.relationSince[id] || new Date().toISOString(); // début des 3 mois d'échange
        s.messages[id] = s.messages[id] || [
          { from: "system", text: "Intérêt réciproque ! Vous êtes désormais mis en relation. Prenez le temps de faire connaissance, dans la paix et la prière.", time: "Aujourd'hui" }
        ];
      } else {
        s.interests[id] = "interet";
      }
      s.passed = s.passed.filter(x => x !== id);
    });
    Remote.push(() => Api.interests.express(id));
    return result;
  },

  pass(id) {
    Store.update(s => { if (!s.passed.includes(id)) s.passed.push(id); delete s.interests[id]; });
    Remote.push(() => Api.profiles.pass(id));
  },

  requestAccompaniment(id) {
    Store.update(s => { if (!s.accompaniment.includes(id)) s.accompaniment.push(id); });
    Remote.push(() => Api.profiles.requestAccompaniment(id));
  },

  moduleProgress(state, id) {
    const done = (state.modules[id] || []).length;
    return Math.round((done / CH_DATA.lessonFormats.length) * 100);
  },
  moduleDone(state, id) { return this.moduleProgress(state, id) === 100; },
  /* L'École du mariage est un module activé à l'entrée dans le parcours Cheminons
     (décision d'avancer ensemble). Avant cela, elle n'est visible nulle part. */
  schoolActive(state) { return Boolean(state.coupleWith); },
  moduleUnlocked(state, id) { return this.schoolActive(state) && (id === 1 || this.moduleDone(state, id - 1)); },

  /* ---------- École du mariage : cours vidéo et audio ---------- */
  /* Cours d'un module : { id, title, type, minutes, speaker, description, url }.
     Démo : CH_DATA.courses (js/data.js) ; mode supabase : cours déposés par l'administrateur
     (#/cours), url fournie seulement pour les modules ouverts au membre. */
  courseLessons(moduleId) { return CH_DATA.courses[moduleId] || []; },
  /* Identifiants des cours suivis dans ce module */
  courseDoneList(state, who, moduleId) { return (state.courses[who] || {})[moduleId] || []; },
  courseDoneCount(state, who, moduleId) {
    const done = this.courseDoneList(state, who, moduleId);
    return this.courseLessons(moduleId).filter(l => done.includes(l.id)).length;
  },
  /* Un module sans cours n'est jamais « terminé » : ses cours restent à venir */
  courseProgress(state, who, moduleId) {
    const total = this.courseLessons(moduleId).length;
    return total ? Math.round((this.courseDoneCount(state, who, moduleId) / total) * 100) : 0;
  },
  courseGlobal(state, who) {
    const total = CH_DATA.modules.reduce((n, m) => n + this.courseLessons(m.id).length, 0);
    const done = CH_DATA.modules.reduce((n, m) => n + this.courseDoneCount(state, who, m.id), 0);
    return total ? Math.round((done / total) * 100) : 0;
  },
  /* Module suivant ouvert quand le précédent a été suivi en entier */
  courseUnlocked(state, moduleId) {
    return this.schoolActive(state) && (moduleId === 1 || this.courseProgress(state, "me", moduleId - 1) === 100);
  },
  /* Module en cours (premier non terminé) */
  courseCurrent(state, who = "me") {
    return (CH_DATA.modules.find(m => this.courseProgress(state, who, m.id) < 100) || CH_DATA.modules[CH_DATA.modules.length - 1]).id;
  },
  markLesson(moduleId, courseId) {
    Store.update(s => {
      const list = (s.courses.me[moduleId] = s.courses.me[moduleId] || []);
      if (!list.includes(courseId)) list.push(courseId);
      s.courses.lastAt.me = new Date().toISOString();
    });
    Remote.push(() => Api.courses.markWatched(moduleId, courseId));
  },
  /* Assiduité, d'après la dernière activité (en jours) */
  assiduity(lastDays, pct) {
    if (pct >= 100) return { label: "Cours terminés", badge: "sage" };
    if (lastDays == null) return { label: "Pas encore commencé", badge: "" };
    if (lastDays <= 7) return { label: "Assidus", badge: "sage" };
    if (lastDays <= 21) return { label: "Réguliers", badge: "sky" };
    return { label: "À encourager", badge: "amber" };
  },
  /* Couples à l'École du mariage (référent : ceux de son église ; administrateur : tous) */
  schoolCouples(state = Store.read(), churchId = null) {
    /* Mode supabase : le serveur n'envoie que les couples visibles par ce compte */
    if (Remote.on) return (Remote.data.couples || []).map(c => ({ ...c, assiduity: this.assiduity(c.lastDays, Math.min(...c.progress)) }));
    const days = iso => iso ? Math.floor((Date.now() - new Date(iso)) / 86400000) : null;
    const list = CH_DATA.couples.map(c => ({ ...c, partners: c.names.split(" & ") }));
    if (state.coupleWith) {
      const p = this.profile(state.coupleWith);
      const last = [state.courses.lastAt.me, state.courses.lastAt.partner].filter(Boolean).sort().pop();
      list.unshift({
        names: `${state.user.firstName} & ${p.firstName}`, partners: [state.user.firstName, p.firstName],
        churchId: state.user.churchId, since: "Octobre 2026", status: "Couple en cheminement", live: true,
        progress: [this.courseGlobal(state, "me"), this.courseGlobal(state, "partner")],
        module: this.courseCurrent(state), lastDays: days(last), colors: [state.user.colors, p.colors]
      });
    }
    return list.filter(c => !churchId || c.churchId === churchId)
      .map(c => ({ ...c, assiduity: this.assiduity(c.lastDays, Math.min(...c.progress)) }));
  },

  schoolDone(state) { return CH_DATA.modules.every(m => this.moduleDone(state, m.id)); },
  accompanimentDone(state) { return state.prep.sessions.length === CH_DATA.sessions.length; },
  preparationDone(state) {
    const total = CH_DATA.prepTasks.reduce((n, g) => n + g.items.length, 0);
    return state.prep.tasks.length === total;
  },

  /* ---------- Signalements et modération ----------
     Le membre signale ; le référent de son église est informé et peut donner son avis ;
     l'administrateur seul décide. La personne signalée ne sait jamais qui l'a signalée. */
  submitReport({ reportedId, reason, details = "", context, excerpt = [] }) {
    const id = "sg" + Date.now();
    Store.update(s => s.reports.unshift({ id, reporter: "me", reportedId, reason, details, context, excerpt, date: new Date().toISOString(), status: "nouveau", referentNote: "" }));
    Remote.push(() => Api.chat.report({ reportedId, reason, details, context, excerpt }));
    return id;
  },
  /* État du compte : actif, suspendu (jusqu'à une date) ou désactivé */
  accountStatus(id, state = Store.read()) {
    const list = state.sanctions[id] || [];
    if (list.some(x => x.type === "desactivation")) return { active: false, type: "desactivation", label: "Compte désactivé" };
    const susp = list.filter(x => x.type === "suspension" && new Date(x.until) > new Date()).pop();
    if (susp) return { active: false, type: "suspension", until: susp.until, label: `Suspendu jusqu'au ${this.formatDate(susp.until.slice(0, 10), { day: "numeric", month: "long" })}` };
    return { active: true, type: "actif", label: "Actif" };
  },
  /* Récidive : une sanction (avertissement ou suspension) a déjà été prononcée */
  isRecidivist(id, state = Store.read()) {
    return (state.sanctions[id] || []).some(x => x.type === "avertissement" || x.type === "suspension");
  },
  /* Décision de l'administrateur : "avertissement" | "suspension" | "desactivation" | "classe" */
  decideReport(reportId, decision, { days = CH_DATA.moderation.minSuspensionDays, note = "" } = {}) {
    Store.update(s => {
      const r = s.reports.find(x => x.id === reportId);
      if (!r) return;
      const now = new Date();
      r.status = "traite";
      r.decision = decision;
      r.decidedAt = now.toISOString();
      r.adminNote = note;
      if (decision === "classe") return;
      if (decision === "desactivation" && !this.isRecidivist(r.reportedId, s)) return; // réservée à la récidive
      const sanction = { type: decision, date: now.toISOString(), reportId, note };
      if (decision === "suspension") {
        r.days = Math.max(CH_DATA.moderation.minSuspensionDays, Number(days));
        sanction.until = new Date(now.getTime() + r.days * 86400000).toISOString();
      }
      (s.sanctions[r.reportedId] = s.sanctions[r.reportedId] || []).push(sanction);
    });
    Remote.push(() => Api.admin.decideReport(reportId, decision, { days: Number(days), note }));
  },
  /* Lever une suspension en cours (l'historique est conservé) */
  liftSuspension(memberId) {
    Store.update(s => (s.sanctions[memberId] || []).forEach(x => {
      if (x.type === "suspension" && new Date(x.until) > new Date()) { x.until = new Date().toISOString(); x.lifted = true; }
    }));
    Remote.push(() => Api.admin.liftSuspension(memberId));
  },
  /* Profil d'un membre impliqué dans un signalement ("me" = membre de la démo) */
  reportMember(id, state = Store.read()) {
    if (Remote.on) return (Remote.data.people || {})[id] || this.profile(id);
    if (id === "me") return { id: "me", firstName: `${state.user.firstName} ${state.user.lastName}`, colors: state.user.colors, churchId: state.user.churchId, city: state.user.city };
    return this.profile(id);
  },
  /* Signalements visibles par un référent : ceux qui concernent un membre de son église */
  reportsForChurch(state, churchId) {
    if (Remote.on) return state.reports;   // déjà limités par le serveur à l'église du référent
    return state.reports.filter(r => [r.reporter, r.reportedId].some(id => this.reportMember(id, state)?.churchId === churchId));
  },

  /* ---------- Temps d'épreuve : 3 mois d'échange avant le parcours Cheminons ---------- */
  cheminantStatus(state, id) {
    const start = new Date(state.relationSince[id] || state.messages[id]?.[0]?.ts || Date.now());
    const unlock = new Date(start);
    unlock.setMonth(unlock.getMonth() + CH_DATA.cheminantDelayMonths);
    const day = 86400000, now = Date.now();
    const total = Math.round((unlock - start) / day);
    const done = Math.min(total, Math.max(0, Math.floor((now - start) / day)));
    const consent = state.cheminantConsent[id] || {};
    return {
      start, unlock, total, done, left: total - done, pct: Math.round((done / total) * 100),
      unlocked: now >= unlock.getTime(),
      me: Boolean(consent.me), them: Boolean(consent.them),
      active: state.interests[id] === "couple",
      messages: (state.messages[id] || []).filter(m => m.from !== "system").length
    };
  },
  /* Activation par le membre depuis son profil. Le parcours s'ouvre quand les deux l'ont activé.
     Renvoie "verrouille" | "en_attente" | "active". */
  activateCheminant(id) {
    const st = this.cheminantStatus(Store.read(), id);
    if (!st.unlocked) return "verrouille";
    let result = "en_attente";
    Store.update(s => {
      s.cheminantConsent[id] = { ...(s.cheminantConsent[id] || {}), me: new Date().toISOString() };
      if (s.cheminantConsent[id].them) {
        result = "active";
        s.interests[id] = "couple";
        s.coupleWith = id;
        (s.messages[id] = s.messages[id] || []).push({ from: "system", text: "Vous avez tous les deux activé le parcours Cheminons. Bienvenue dans l'École du mariage ! Vos référents ont été informés.", ts: new Date().toISOString() });
      }
    });
    Remote.push(() => Api.relations.advance(id));
    return result;
  },
  /* Relation en cours (mise en relation ou couple) */
  relationId(state) {
    return Object.keys(state.interests).find(k => ["relation", "couple"].includes(state.interests[k]) && this.profile(k));
  },

  /* Position dans le parcours global (index de l'étape en cours) */
  journeyIndex(state) {
    if (state.user.status !== "actif") return 2;
    if (state.coupleWith) {
      if (!this.schoolDone(state)) return 11;
      if (!this.accompanimentDone(state)) return 12;
      if (!this.preparationDone(state)) return 13;
      return state.prep.married ? 15 : 14;
    }
    const statuses = Object.values(state.interests);
    const rel = Object.keys(state.interests).find(k => state.interests[k] === "relation");
    if (rel) return this.cheminantStatus(state, rel).unlocked ? 9 : 8;
    if (statuses.includes("interet")) return 5;
    return 4;
  },

  /* Notifications calculées à partir de l'état de démo */
  notifications(state) {
    const list = [];
    /* Mode supabase : notifications enregistrées par le serveur (décisions, entretiens, sanctions…) */
    const inbox = (state.inbox || []).slice().reverse();
    if (!state.user.churchId) return inbox.reverse();
    const church = this.church(state.user.churchId) || { referent: "votre référent" };
    if (state.user.status !== "actif") {
      list.push({ id: "pending", icon: "clock", text: `Votre demande est en cours de validation par ${church.referent}.`, href: "#/tableau-de-bord" });
      return list.concat(inbox).reverse();
    }
    list.push({ id: "validated", icon: "shield", text: `Votre profil a été validé par ${church.referent}. Bienvenue sur Cheminons !`, href: "#/tableau-de-bord" });
    if (state.settings.suggestions) list.push({ id: "sugg-w41", icon: "compass", text: "De nouvelles suggestions vous attendent cette semaine.", href: "#/tableau-de-bord" });
    this.visibleProfiles(state).filter(p => p.receivedInterest && !state.interests[p.id]).forEach(p =>
      list.push({ id: "int-" + p.id, icon: "heart", text: `${p.firstName} a manifesté son intérêt pour votre profil.`, href: "#/interets" }));
    Object.keys(state.interests).filter(id => ["relation", "couple"].includes(state.interests[id])).forEach(id => {
      const p = this.profile(id);
      if (!p) return;
      list.push({ id: "rel-" + id, icon: "users", text: `Intérêt réciproque avec ${p.firstName} : votre espace « Notre cheminement » est ouvert.`, href: `#/cheminement?id=${id}` });
      const st = this.cheminantStatus(state, id);
      if (st.active || !st.unlocked) return;
      list.push({ id: "unlock-" + id, icon: "ring", text: `Vos trois mois d'échange avec ${p.firstName} sont accomplis : vous pouvez activer le parcours Cheminons depuis votre profil.`, href: "#/mon-profil/parcours-cheminant" });
      if (st.them && !st.me) list.push({ id: "consent-" + id, icon: "ring", text: `${p.firstName} a activé le parcours Cheminons. À vous de confirmer depuis votre profil.`, href: "#/mon-profil/parcours-cheminant" });
    });
    if (this.canChat(state)) this.conversations(state).filter(c => c.unread).forEach(c =>
      list.push({ id: `msg-${c.p.id}-${c.msgs.length}`, icon: "chat", text: `Nouveau message de ${c.p.firstName}.`, href: `#/messages?id=${c.p.id}` }));
    state.reports.filter(r => r.reporter === "me" && r.status === "traite").forEach(r =>
      list.push({ id: "report-" + r.id, icon: "shield", text: "Votre signalement a été examiné et traité par l'équipe Cheminons. Merci de veiller avec nous sur la communauté.", href: "#/messages" }));
    if (state.coupleWith) list.push({ id: "couple", icon: "ring", text: "Bienvenue dans le parcours Cheminons ! L'École du mariage vous est ouverte.", href: "#/ecole" });
    if (state.coupleWith && this.schoolDone(state)) list.push({ id: "accomp", icon: "hands", text: "École du mariage terminée : votre accompagnement peut commencer.", href: "#/preparation" });
    return list.concat(inbox).reverse(); // les plus récentes d'abord
  },

  /* ---------- Messagerie entre membres ----------
     Accès réservé aux membres validés par leur référent ET à jour de leur formule,
     des deux côtés. Le serveur appliquera la même règle (403 sinon). */
  memberPaid(state) { return state.user.paid !== false; },
  /* Règlement de la formule (démo : le serveur le confirmera après retour du prestataire de paiement) */
  subscribe(plan, method, region) {
    const s0 = Store.read();
    region = region || this.region(s0.user.churchId);
    const price = this.price(region, plan);
    const until = new Date();
    until.setMonth(until.getMonth() + price.months);
    const provider = (CH_DATA.paymentMethods[region].find(m => m.key === method) || {}).provider;
    const payment = { date: new Date().toISOString(), plan, method, provider, region, amount: price.amount, currency: price.currency, until: until.toISOString() };
    Store.update(s => {
      Object.assign(s.user, { paid: true, renews: true, plan, paidUntil: payment.until, paymentMethod: method, paymentRegion: region });
      (s.payments = s.payments || []).unshift(payment);
      if (s.candidates[s.user.candidateId]) s.candidates[s.user.candidateId].plan = plan;
    });
    return payment;
  },
  canChat(state) { return state.user.status === "actif" && this.memberPaid(state); },
  chatEligible(p) { return Boolean(p) && p.status !== "en_attente_validation" && p.paid !== false && this.accountStatus(p.id).active; },
  /* Tous les membres joignables (les deux sexes : échanges fraternels compris), hors profils en pause */
  chatMembers(state) {
    return CH_DATA.profiles.filter(p => this.chatEligible(p) && !p.paused && !state.blocked.includes(p.id));
  },
  unread(state, id) {
    return (state.messages[id] || []).slice(state.chatRead[id] || 0).filter(m => m.from === "them").length;
  },
  unreadTotal(state) {
    return this.canChat(state) ? this.conversations(state).reduce((n, c) => n + c.unread, 0) : 0;
  },
  /* Fils existants, du plus récent au plus ancien */
  conversations(state) {
    return Object.keys(state.messages)
      .map(id => ({ p: this.profile(id), msgs: state.messages[id] || [] }))
      .filter(c => this.chatEligible(c.p) && !state.blocked.includes(c.p.id) && c.msgs.some(m => m.from !== "system"))
      .map(c => ({ ...c, last: c.msgs[c.msgs.length - 1], unread: this.unread(state, c.p.id) }))
      .sort((a, b) => (b.last.ts || "").localeCompare(a.last.ts || ""));
  },
  markRead(id) {
    const s = Store.read();
    const n = (s.messages[id] || []).length;
    if ((s.chatRead[id] || 0) === n) return;
    Store.update(st => { st.chatRead[id] = n; });
    Remote.push(() => Api.chat.markRead(id));
  },
  /* Ajoute un message au fil (from : "me" | "them" | "system") */
  postMessage(id, from, text) {
    const now = new Date();
    const msg = { from, text, ts: now.toISOString(), time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
    Store.update(s => {
      (s.messages[id] = s.messages[id] || []).push(msg);
      if (from === "me") s.chatRead[id] = s.messages[id].length;
    });
    if (from === "me") Remote.push(() => Api.chat.send(id, text));
    return msg;
  },
  /* Présence : « En ligne », « Vu il y a 12 min »… (simulée en démo, dernière activité en mode supabase) */
  presence(id) {
    const min = Remote.on ? (this.profile(id)?.lastSeenMin ?? 1440) : (CH_DATA.chat.presence[id] ?? 1440);
    if (min === 0) return { online: true, label: "En ligne" };
    if (min < 60) return { online: false, label: `Vu il y a ${min} min` };
    if (min < 1440) return { online: false, label: `Vu il y a ${Math.round(min / 60)} h` };
    return { online: false, label: "Vu hier" };
  },
  /* Heure d'un message : « 14:05 » aujourd'hui, « Hier », sinon « 3 oct. » */
  chatTime(m, long = false) {
    if (!m.ts) return m.time || "";
    const d = new Date(m.ts);
    const day = this.chatDay(m);
    const hour = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (long || day === "Aujourd'hui") return hour;
    return day === "Hier" ? "Hier" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  },
  chatDay(m) {
    if (!m.ts) return m.time || "";
    const d = new Date(m.ts), today = new Date();
    const diff = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  },

  /* ---------- Tarifs et reversements ---------- */
  region(churchId) { return this.church(churchId)?.region || "europe"; },
  price(region, plan) {
    const r = CH_DATA.pricing.find(p => p.region === region) || CH_DATA.pricing[0];
    return { ...r.plans[plan], currency: r.currency, taxRate: r.taxRate };
  },
  /* Économie de la formule trimestrielle par rapport à 3 mois de SINGLE */
  quarterlySaving(region) {
    const r = CH_DATA.pricing.find(p => p.region === region);
    return r.plans.single.amount * r.plans.cheminant.months - r.plans.cheminant.amount;
  },
  money(amount, currency) {
    if (currency === "XOF") return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
    const cents = Math.round(amount * 100) % 100 !== 0;
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
  },
  /* Inscriptions validées (le candidat k1 est le membre de la démo : sa formule est celle choisie à l'inscription) */
  validatedCandidates(state = Store.read()) {
    return CH_DATA.candidates
      .map(c => ({ ...c, ...state.candidates[c.id], ...(c.id === state.user.candidateId ? { plan: state.user.plan || c.plan } : {}) }))
      .filter(c => c.decision === "valider")
      /* validatedBy : référent qui a validé ; par défaut, le référent connecté dans la démo */
      .map(c => ({ ...c, validatedBy: c.validatedBy || CH_DATA.demoReferentId }));
  },
  /* Chaque inscription validée vaut le prix de sa formule. Taxes déduites, 10 % du montant HT
     reviennent au référent qui a validé et 10 % à son église. Le serveur refera ce calcul :
     ces montants ne doivent jamais être envoyés à un autre destinataire. */
  reversement(candidate, churchId = "c1") {
    const p = this.price(this.region(churchId), candidate.plan || "single");
    /* Arrondi par ligne (centime en euros, unité en francs CFA), comme en comptabilité */
    const round = n => p.currency === "XOF" ? Math.round(n) : Math.round(n * 100) / 100;
    const net = round(p.amount / (1 + p.taxRate));
    return {
      gross: p.amount, net, tax: round(p.amount - net), currency: p.currency,
      referent: round(net * CH_DATA.reversion.referent),
      church: round(net * CH_DATA.reversion.church),
      /* Part du site : le montant HT moins les deux reversements */
      get platform() { return round(this.net - this.referent - this.church); }
    };
  },
  /* Grand livre (super administrateur uniquement) : toutes les inscriptions validées du réseau,
     avec la répartition complète de chaque montant */
  ledger(state = Store.read()) {
    /* Mode supabase : grand livre calculé par le serveur (administrateur uniquement) */
    if (Remote.on) return (Remote.data.ledger || []).map(r => {
      const church = this.church(r.churchId) || {};
      return { ...r, church: church.name || "", city: church.city || "" };
    });
    const local = this.validatedCandidates(state).map(c => ({ id: c.id, name: c.name, colors: c.colors, churchId: "c1", referentId: c.validatedBy, plan: c.plan, validatedAt: c.validatedAt }));
    return local.concat(CH_DATA.registrationsHistory).map(r => {
      const church = this.church(r.churchId);
      const split = this.reversement(r, r.churchId);
      return {
        ...r, church: church.name, city: church.city, referent: this.referent(r.referentId, state)?.name || church.referent, region: this.region(r.churchId),
        currency: split.currency, gross: split.gross, tax: split.tax, net: split.net,
        toReferent: split.referent, toChurch: split.church, toPlatform: split.platform
      };
    }).sort((a, b) => (b.validatedAt || "").localeCompare(a.validatedAt || ""));
  },
  /* Reversements d'UN référent : uniquement les inscriptions qu'il a validées et uniquement
     sa part (10 % du HT). Ni le prix, ni le HT, ni la part de l'église ne sont exposés. */
  referentEarnings(referentId, state = Store.read()) {
    if (Remote.on) return Remote.data.referentEarnings || [];   // uniquement la part de ce référent
    return this.ledger(state).filter(t => t.referentId === referentId).map(t => ({
      id: t.id, name: t.name, colors: t.colors, validatedAt: t.validatedAt, plan: t.plan,
      amount: t.toReferent, currency: t.currency
    }));
  },
  /* Reversements d'UNE église : les inscriptions validées par l'ensemble de ses référents
     et uniquement sa part (10 % du HT). La part de chaque référent n'est jamais exposée. */
  churchEarnings(churchId, state = Store.read()) {
    if (Remote.on) return Remote.data.churchEarnings || [];     // uniquement la part de cette église
    return this.ledger(state).filter(t => t.churchId === churchId).map(t => ({
      id: t.id, name: t.name, colors: t.colors, validatedAt: t.validatedAt, plan: t.plan,
      referentId: t.referentId, referent: t.referent, amount: t.toChurch, currency: t.currency
    }));
  },
  formatDate(iso, opts = { day: "numeric", month: "short", year: "numeric" }) {
    if (!iso) return "—";
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("fr-FR", opts);
  },

  /* Total par devise d'une liste de lignes { amount, currency } */
  sumByCurrency(rows) {
    const totals = {};
    rows.forEach(r => { totals[r.currency] = Math.round(((totals[r.currency] || 0) + r.amount) * 100) / 100; });
    return Object.entries(totals).map(([currency, amount]) => this.money(amount, currency)).join(" et ") || this.money(0, "EUR");
  },

  initials(name) { return this.escape(String(name).split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()); },

  /* Photo de profil si le membre en a une, sinon ses initiales sur fond dégradé */
  avatar(name, colors, size = "", photo = null) {
    const src = typeof safePhotoSrc === "function" ? safePhotoSrc(photo) : "";
    if (src) return `<span class="avatar avatar--photo ${size ? "avatar--" + size : ""}" aria-hidden="true"><img src="${src}" alt=""></span>`;
    const [a, b] = colors || ["#a3204f", "#c7962c"];
    return `<span class="avatar ${size ? "avatar--" + size : ""}" style="--a1:${a};--a2:${b}" aria-hidden="true">${this.initials(name)}</span>`;
  },

  levelBadge(level) {
    const l = CH_DATA.levels[level];
    return `<span class="badge badge--${l.badge}">${l.label}</span>`;
  },

  /* Paramètre de l'adresse courante : #/profil?id=p1 → CH.param("id") === "p1" */
  param(name) { return App.parse().query.get(name); },

  escape(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  /* Nettoie un champ d'identité saisi (nom, ville, église, rôle, lieu…) avant de l'enregistrer :
     retire les caractères de balisage et de contrôle, limite la longueur.
     Complète CH.escape à l'affichage ; le serveur refera cette validation. */
  clean(str, max = 120) {
    return String(str ?? "").replace(/[<>"`\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  },

  /* Mot de passe : message d'erreur, ou "" s'il est assez solide (mêmes règles que Supabase Auth) */
  passwordIssue(pw) {
    if (String(pw).length < 10) return "Le mot de passe doit contenir au moins 10 caractères.";
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.";
    return "";
  }
};
