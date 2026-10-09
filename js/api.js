/* =========================================================
   CHEMINANT — couche d'accès aux données
   Point de passage unique entre l'interface et les données.
   Toutes les méthodes renvoient une Promise, comme le fera l'API réelle.

   - Mode "demo" : s'appuie sur CH_DATA (js/data.js) et Store (localStorage).
   - Mode "api"  : appelle l'API serveur (CH_CONFIG.apiBaseUrl), elle-même
                   connectée à Neon. Le contrat de chaque route est indiqué
                   au-dessus de la méthode et détaillé dans docs/BACKEND-NEON.md.

   Migration progressive : les vues utilisent encore Store / CH en direct ;
   chaque vue pourra basculer sur Api.* sans changer son rendu.
   ========================================================= */

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const Http = {
  async request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CH_CONFIG.requestTimeoutMs);
    try {
      const res = await fetch(CH_CONFIG.apiBaseUrl + path, {
        method,
        credentials: "include", // session par cookie httpOnly posé par le serveur
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      const data = res.status === 204 ? null : await res.json().catch(() => null);
      if (!res.ok) throw new ApiError(data?.message || "Une erreur est survenue. Merci de réessayer.", res.status, data);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("Connexion au serveur impossible. Vérifiez votre connexion internet.", 0);
    } finally {
      clearTimeout(timer);
    }
  },
  get: (path) => Http.request("GET", path),
  post: (path, body) => Http.request("POST", path, body || {}),
  patch: (path, body) => Http.request("PATCH", path, body || {}),
  del: (path) => Http.request("DELETE", path)
};

const isDemo = () => CH_CONFIG.dataSource === "demo";
const demo = (fn) => Promise.resolve().then(fn);

const Api = {
  /* ---------- Session ---------- */
  auth: {
    /* POST /auth/login { email, password } → { user } */
    login: (email, password) => isDemo() ? demo(() => ({ user: Store.read().user })) : Http.post("/auth/login", { email, password }),
    /* POST /auth/logout → 204 */
    logout: () => isDemo() ? demo(() => null) : Http.post("/auth/logout"),
    /* GET /me → { user } (membre, référent ou administrateur connecté) */
    me: () => isDemo() ? demo(() => ({ user: Store.read().user })) : Http.get("/me")
  },

  /* ---------- Inscription et églises ---------- */
  churches: {
    /* GET /churches?q= → Church[] (uniquement les églises partenaires actives) */
    list: (q = "") => isDemo()
      ? demo(() => CH.allChurches().filter(c => `${c.name} ${c.city}`.toLowerCase().includes(q.toLowerCase())))
      : Http.get(`/churches?q=${encodeURIComponent(q)}`),
    /* POST /church-requests { church, city, denomination, contact, referent, members } → { id } */
    requestPartnership: (payload) => isDemo()
      ? demo(() => { const id = "r" + Date.now(); Store.update(s => s.partnerRequests.unshift({ id, ...payload, status: "nouvelle" })); return { id }; })
      : Http.post("/church-requests", payload)
  },

  candidates: {
    /* POST /candidates { identité, églises, réponses au questionnaire } → { status: "en_attente_validation" } */
    register: (payload) => isDemo()
      ? demo(() => { Store.update(s => { Object.assign(s.user, payload.user || {}); s.user.status = "en_attente_validation"; }); return { status: "en_attente_validation" }; })
      : Http.post("/candidates", payload)
  },

  /* ---------- Formule et paiement ---------- */
  payments: {
    /* POST /payments/checkout { plan: "single" | "cheminant", region: "europe" | "afrique", method } → { checkoutUrl }
       Europe : Stripe (carte) ou PayPal ; Afrique : agrégateur Mobile Money.
       403 tant que le profil n'est pas validé. Le règlement a lieu sur la page du prestataire ;
       son retour (webhook) renseigne member_profiles.paid_until et ouvre la messagerie. */
    checkout: (plan, method, region) => isDemo() ? demo(() => CH.subscribe(plan, method, region)) : Http.post("/payments/checkout", { plan, method, region }),
    /* GET /payments → Payment[] (historique du membre connecté) */
    list: () => isDemo() ? demo(() => Store.read().payments || []) : Http.get("/payments")
  },

  /* ---------- Profils ---------- */
  profiles: {
    /* GET /profiles?city=&ageMin=&ageMax=&denomination= → ProfileSummary[] (sexe opposé, profils actifs) */
    search: (filters = {}) => isDemo()
      ? demo(() => CH.visibleProfiles(Store.read()))
      : Http.get("/profiles?" + new URLSearchParams(filters)),
    /* GET /profiles/:id → Profile + convergences (jamais le score brut) */
    get: (id) => isDemo() ? demo(() => CH.profile(id)) : Http.get(`/profiles/${encodeURIComponent(id)}`),
    /* POST /profiles/:id/pass → 204 */
    pass: (id) => isDemo() ? demo(() => CH.pass(id)) : Http.post(`/profiles/${encodeURIComponent(id)}/pass`),
    /* POST /accompaniment-requests { profileId } → 201 */
    requestAccompaniment: (id) => isDemo() ? demo(() => CH.requestAccompaniment(id)) : Http.post("/accompaniment-requests", { profileId: id })
  },

  /* ---------- Intérêts et mise en relation ---------- */
  interests: {
    /* GET /interests → { sent: [], received: [], mutual: [] } */
    list: () => isDemo() ? demo(() => Store.read().interests) : Http.get("/interests"),
    /* POST /interests { profileId } → { status: "interet" | "relation" } (réciproque si l'autre l'a déjà manifesté) */
    express: (id) => isDemo() ? demo(() => ({ status: CH.expressInterest(id) })) : Http.post("/interests", { profileId: id })
  },

  /* ---------- Messagerie entre membres ----------
     Règle serveur : 403 si l'un des deux membres n'est pas validé (statut actif)
     ou n'est pas à jour de sa formule (paid_until), ou si l'un a bloqué l'autre. */
  chat: {
    /* GET /conversations → [{ member: ProfileSummary, lastMessage, unread }] (plus récentes d'abord) */
    list: () => isDemo() ? demo(() => CH.conversations(Store.read())) : Http.get("/conversations"),
    /* GET /chat/members?q= → ProfileSummary[] + presence (membres joignables, les deux sexes) */
    members: (q = "") => isDemo()
      ? demo(() => CH.chatMembers(Store.read()).filter(p => `${p.firstName} ${p.city}`.toLowerCase().includes(q.toLowerCase())))
      : Http.get(`/chat/members?q=${encodeURIComponent(q)}`),
    /* GET /conversations/:memberId/messages?before= → Message[] { id, from, text, ts, react } */
    messages: (id) => isDemo() ? demo(() => Store.read().messages[id] || []) : Http.get(`/conversations/${encodeURIComponent(id)}/messages`),
    /* POST /conversations/:memberId/messages { text } → Message (crée la conversation au premier message) */
    send: (id, text) => isDemo() ? demo(() => CH.postMessage(id, "me", text)) : Http.post(`/conversations/${encodeURIComponent(id)}/messages`, { text }),
    /* POST /conversations/:memberId/read → 204 */
    markRead: (id) => isDemo() ? demo(() => CH.markRead(id)) : Http.post(`/conversations/${encodeURIComponent(id)}/read`),
    /* PUT /messages/:messageId/reaction { key: "amen" | "merci" | "bravo" | null } → 204 */
    react: (messageId, key) => isDemo() ? demo(() => null) : Http.request("PUT", `/messages/${encodeURIComponent(messageId)}/reaction`, { key }),
    /* POST /members/:id/block → 204 ; DELETE /members/:id/block → 204 */
    block: (id) => isDemo() ? demo(() => Store.update(s => { if (!s.blocked.includes(id)) s.blocked.push(id); })) : Http.post(`/members/${encodeURIComponent(id)}/block`),
    unblock: (id) => isDemo() ? demo(() => Store.update(s => { s.blocked = s.blocked.filter(x => x !== id); })) : Http.del(`/members/${encodeURIComponent(id)}/block`),
    /* POST /reports { reportedId, reason, details, context, excerpt[] } → 201
       Transmis au référent de l'église du signalant ET à l'administrateur. L'auteur n'est jamais révélé au membre signalé. */
    report: (payload) => isDemo() ? demo(() => CH.submitReport(payload)) : Http.post("/reports", payload)
  },

  relations: {
    /* GET /relations/:id/messages → Message[] : même fil que /conversations/:memberId/messages */
    messages: (id) => isDemo() ? demo(() => Store.read().messages[id] || []) : Http.get(`/relations/${encodeURIComponent(id)}/messages`),
    /* POST /relations/:id/messages { text } → Message */
    send: (id, text) => isDemo()
      ? demo(() => { const msg = { from: "me", text, time: "À l'instant" }; Store.update(s => (s.messages[id] = s.messages[id] || []).push(msg)); return msg; })
      : Http.post(`/relations/${encodeURIComponent(id)}/messages`, { text }),
    /* GET /relations/:id/cheminant → { start, unlockAt, unlocked, me, them } */
    cheminant: (id) => isDemo() ? demo(() => CH.cheminantStatus(Store.read(), id)) : Http.get(`/relations/${encodeURIComponent(id)}/cheminant`),
    /* POST /relations/:id/advance → { status: "en_attente_partenaire" | "couple_en_cheminement" }
       Activation par le membre connecté, depuis son profil. 403 tant que 3 mois ne se sont pas
       écoulés depuis la mise en relation ; le couple n'est créé que lorsque les deux ont activé. */
    advance: (id) => isDemo()
      ? demo(() => ({ status: { active: "couple_en_cheminement", en_attente: "en_attente_partenaire" }[CH.activateCheminant(id)] || "verrouille" }))
      : Http.post(`/relations/${encodeURIComponent(id)}/advance`)
  },

  /* ---------- École du mariage ---------- */
  courses: {
    /* GET /school/courses → { [moduleId]: [{ title, type: "video" | "audio", minutes, speaker, mediaUrl }] } */
    list: () => isDemo() ? demo(() => CH_DATA.courses) : Http.get("/school/courses"),
    /* GET /school/courses/progress → { me: { [moduleId]: index[] }, partner: { … } } (couple connecté) */
    progress: () => isDemo() ? demo(() => Store.read().courses) : Http.get("/school/courses/progress"),
    /* POST /school/courses/:moduleId/:index/watched → 204 (403 si le module n'est pas encore ouvert) */
    markWatched: (moduleId, index) => isDemo()
      ? demo(() => CH.markLesson(moduleId, index))
      : Http.post(`/school/courses/${moduleId}/${index}/watched`)
  },
  school: {
    /* GET /school/progress → { [moduleId]: lessonIndex[] } */
    progress: () => isDemo() ? demo(() => Store.read().modules) : Http.get("/school/progress"),
    /* POST /school/modules/:id/lessons/:index/complete → 204 */
    completeLesson: (moduleId, index) => isDemo()
      ? demo(() => Store.update(s => { const l = (s.modules[moduleId] = s.modules[moduleId] || []); if (!l.includes(index)) l.push(index); }))
      : Http.post(`/school/modules/${moduleId}/lessons/${index}/complete`)
  },

  /* ---------- Notifications ---------- */
  notifications: {
    /* GET /notifications → Notification[] */
    list: () => isDemo() ? demo(() => CH.notifications(Store.read())) : Http.get("/notifications"),
    /* POST /notifications/read { ids } → 204 */
    markRead: (ids) => isDemo()
      ? demo(() => Store.update(s => { s.readNotifs = [...new Set(s.readNotifs.concat(ids))]; }))
      : Http.post("/notifications/read", { ids })
  },

  /* ---------- Espace référent ---------- */
  referent: {
    /* GET /referent/candidates → Candidate[] (uniquement ceux de son église) */
    candidates: () => isDemo() ? demo(() => Store.read().candidates) : Http.get("/referent/candidates"),
    /* POST /referent/candidates/:id/interview { date, place } → { interview: "planifie" } */
    planInterview: (id, payload) => isDemo()
      ? demo(() => Store.update(s => { s.candidates[id] = { ...(s.candidates[id] || {}), interview: "planifie", ...payload }; }))
      : Http.post(`/referent/candidates/${encodeURIComponent(id)}/interview`, payload),
    /* POST /referent/candidates/:id/decision { decision, internalNote } — internalNote n'est jamais renvoyée au candidat */
    decide: (id, decision, internalNote = "") => isDemo()
      ? demo(() => Store.update(s => { s.candidates[id] = { ...(s.candidates[id] || {}), decision }; }))
      : Http.post(`/referent/candidates/${encodeURIComponent(id)}/decision`, { decision, internalNote }),
    /* GET /referent/school → [{ couple, progress: [pctA, pctB], module, lastActivity }] (couples de son église) */
    school: () => isDemo() ? demo(() => CH.schoolCouples(Store.read(), "c1")) : Http.get("/referent/school"),
    /* GET /referent/reports → Report[] (uniquement ceux impliquant un membre de son église) */
    reports: () => isDemo() ? demo(() => CH.reportsForChurch(Store.read(), "c1")) : Http.get("/referent/reports"),
    /* POST /referent/reports/:id/note { note } → 204 (avis consultatif transmis à l'administrateur) */
    noteReport: (id, note) => isDemo()
      ? demo(() => Store.update(s => { s.reports.find(r => r.id === id).referentNote = note; }))
      : Http.post(`/referent/reports/${encodeURIComponent(id)}/note`, { note }),
    /* GET /referent/reversements → { lines: [{ candidate, validatedAt, plan, amount, currency }] }
       Uniquement les inscriptions validées par le référent connecté et uniquement sa part (10 % du HT).
       Jamais le prix TTC, le montant HT, la part de l'église ni celle d'un autre référent. */
    reversements: () => isDemo()
      ? demo(() => ({ lines: CH.referentEarnings(CH_DATA.demoReferentId).map(l => ({ candidate: l.name, validatedAt: l.validatedAt, plan: l.plan, amount: l.amount, currency: l.currency })) }))
      : Http.get("/referent/reversements")
  },

  /* ---------- Espace église ---------- */
  church: {
    /* GET /church/reversements → { lines: [{ candidate, validatedAt, plan, referent, amount, currency }] }
       Inscriptions validées par TOUS les référents de l'église du compte connecté, uniquement la part
       de l'église (10 % du HT). Jamais le prix TTC, le montant HT ni la part d'un référent. */
    reversements: () => isDemo()
      ? demo(() => ({ lines: CH.churchEarnings("c1").map(l => ({ candidate: l.name, validatedAt: l.validatedAt, plan: l.plan, referent: l.referent, amount: l.amount, currency: l.currency })) }))
      : Http.get("/church/reversements"),
    /* GET /church/referents → [{ id, name, email, role, trained }] (référents de l'église du compte connecté) */
    referents: () => isDemo() ? demo(() => CH.referentsOf("c1")) : Http.get("/church/referents"),
    /* POST /church/referents { name, email, role } → { id } ; pas de limite de nombre.
       Le serveur crée l'invitation et l'entrée church_referents de l'église du compte connecté. */
    addReferent: (payload) => isDemo()
      ? demo(() => Store.update(s => { s.extraReferents.push({ id: `xr-${Date.now()}`, churchId: "c1", ...payload, trained: false }); }))
      : Http.post("/church/referents", payload)
  },

  /* ---------- Administration ---------- */
  admin: {
    /* GET /admin/ledger?currency=EUR&month=2026-10 → toutes les inscriptions validées et leur répartition
       (TTC, taxes, HT, part référent, part église, part Cheminant). Super administrateur uniquement. */
    ledger: () => isDemo() ? demo(() => CH.ledger()) : Http.get("/admin/ledger"),
    /* GET /admin/school → progression de tous les couples à l'École du mariage */
    school: () => isDemo() ? demo(() => CH.schoolCouples(Store.read())) : Http.get("/admin/school"),
    /* GET /admin/reports?status=nouveau|traite → Report[] + historique des sanctions du membre signalé */
    reports: () => isDemo() ? demo(() => Store.read().reports) : Http.get("/admin/reports"),
    /* POST /admin/reports/:id/decision { decision: "avertissement" | "suspension" | "desactivation" | "classe", days?, note? }
       Super administrateur uniquement. suspension : days >= 2. desactivation : 422 sans sanction antérieure (récidive). */
    decideReport: (id, decision, opts) => isDemo()
      ? demo(() => CH.decideReport(id, decision, opts))
      : Http.post(`/admin/reports/${encodeURIComponent(id)}/decision`, { decision, ...opts }),
    /* POST /admin/members/:id/lift-suspension → 204 */
    liftSuspension: (id) => isDemo() ? demo(() => CH.liftSuspension(id)) : Http.post(`/admin/members/${encodeURIComponent(id)}/lift-suspension`),
    /* GET /admin/church-requests → ChurchRequest[] */
    churchRequests: () => isDemo() ? demo(() => Store.read().partnerRequests) : Http.get("/admin/church-requests"),
    /* POST /admin/church-requests/:id/questions { questions: string[], message } → 204
       Envoie les questions au responsable de l'église ; la demande passe au statut « precisions ». */
    askChurchRequest: (id, questions, message) => isDemo()
      ? demo(() => Store.update(s => Object.assign(s.partnerRequests.find(r => r.id === id), { status: "precisions", questions, message })))
      : Http.post(`/admin/church-requests/${encodeURIComponent(id)}/questions`, { questions, message }),
    /* PATCH /admin/church-requests/:id { status: "acceptee" | "refusee" } */
    reviewChurchRequest: (id, status) => isDemo()
      ? demo(() => Store.update(s => { const r = s.partnerRequests.find(x => x.id === id); if (r) r.status = status; }))
      : Http.patch(`/admin/church-requests/${encodeURIComponent(id)}`, { status })
  }
};
