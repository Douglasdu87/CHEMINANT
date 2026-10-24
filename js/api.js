/* =========================================================
   CHEMINONS — couche d'accès aux données
   Point de passage unique entre l'interface et les données.
   Toutes les méthodes renvoient une Promise, comme le fera l'API réelle.

   - Mode "demo"     : s'appuie sur CH_DATA (js/data.js) et Store (localStorage).
   - Mode "supabase" : la session passe par Supabase Auth (supabase-js, chargé
                       à la demande) ; les données passent par l'Edge Function
                       « api » (supabase/functions/api), qui applique les règles
                       métier avec la clé service_role. Le contrat de chaque route
                       est indiqué au-dessus de la méthode et détaillé dans
                       docs/BACKEND-SUPABASE.md.

   En mode "supabase", les écrans lisent l'état chargé par GET /state
   (js/remote.js) et envoient chaque action par Remote.push(() => Api.…).
   ========================================================= */

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/* Client Supabase, créé au premier appel (le mode démo ne charge rien) */
const Supa = {
  _client: null,
  client() {
    if (!Supa._client) {
      Supa._client = new Promise((resolve, reject) => {
        const ready = () => resolve(window.supabase.createClient(CH_CONFIG.supabaseUrl, CH_CONFIG.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
        }));
        if (window.supabase) return ready();
        const s = document.createElement("script");
        s.src = CH_CONFIG.supabaseJsUrl;
        s.onload = ready;
        s.onerror = () => { Supa._client = null; reject(new ApiError("Connexion au serveur impossible. Vérifiez votre connexion internet.", 0)); };
        document.head.appendChild(s);
      });
    }
    return Supa._client;
  },
  async token() {
    const { data } = await (await Supa.client()).auth.getSession();
    return data.session?.access_token || null;
  }
};

const Http = {
  async request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CH_CONFIG.requestTimeoutMs);
    try {
      const token = await Supa.token();
      // Une clé publishable n'est pas un jeton : Authorization ne porte que la session
      const headers = { apikey: CH_CONFIG.supabaseAnonKey };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body) headers["Content-Type"] = "application/json";
      const res = await fetch(`${CH_CONFIG.supabaseUrl}/functions/v1/api${path}`, {
        method,
        headers,
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
  put: (path, body) => Http.request("PUT", path, body || {}),
  patch: (path, body) => Http.request("PATCH", path, body || {}),
  del: (path) => Http.request("DELETE", path)
};

/* Erreurs Supabase Auth → messages neutres (jamais le détail technique) */
const authMessage = (error) => {
  const code = error.code || "";
  if (code === "email_not_confirmed") return "Merci de confirmer votre adresse e-mail : un lien vous a été envoyé.";
  if (code === "weak_password") return "Ce mot de passe est trop simple. Choisissez-en un plus long.";
  if (code === "over_email_send_rate_limit" || error.status === 429) return "Trop de tentatives. Merci de patienter quelques minutes.";
  if (code === "same_password") return "Choisissez un mot de passe différent de l'ancien.";
  if (code === "user_already_exists" || code === "email_exists") return "Un compte existe déjà avec cette adresse e-mail. Connectez-vous.";
  if (error.status === 400) return "Adresse e-mail ou mot de passe incorrect.";
  return "Une erreur est survenue. Merci de réessayer.";
};
const authCall = async (fn) => {
  const { data, error } = await fn((await Supa.client()).auth);
  if (error) throw new ApiError(authMessage(error), error.status || 0);
  return data;
};
/* Adresse de retour des liens envoyés par e-mail (confirmation, invitation, mot de passe) */
const siteUrl = () => location.origin + location.pathname;

const isDemo = () => CH_CONFIG.dataSource === "demo";
const demo = (fn) => Promise.resolve().then(fn);

const Api = {
  /* GET /state → { role, email, needsProfile?, state, data } : état du compte connecté (js/remote.js) */
  state: () => Http.get("/state"),

  /* ---------- Session ---------- */
  auth: {
    /* Supabase Auth : signInWithPassword, puis GET /me → { user } (profil métier) */
    login: (email, password) => isDemo()
      ? demo(() => ({ user: Store.read().user }))
      : authCall(a => a.signInWithPassword({ email, password })).then(() => Http.get("/me")),
    /* Supabase Auth : signUp { email, password, data: { first_name, last_name } } → { session } (null si confirmation requise)
       Le déclencheur on_auth_user_created crée la ligne public.users (rôle « membre »). */
    signUp: (email, password, firstName, lastName) => isDemo()
      ? demo(() => null)
      : authCall(a => a.signUp({ email, password, options: { emailRedirectTo: siteUrl(), data: { first_name: firstName, last_name: lastName } } })),
    /* Supabase Auth : lien de réinitialisation du mot de passe */
    resetPassword: (email) => isDemo() ? demo(() => null) : authCall(a => a.resetPasswordForEmail(email, { redirectTo: siteUrl() })),
    /* Supabase Auth : nouveau mot de passe (invitation d'un référent, mot de passe oublié) */
    updatePassword: (password) => isDemo() ? demo(() => null) : authCall(a => a.updateUser({ password })),
    /* Supabase Auth : signOut */
    logout: () => isDemo() ? demo(() => null) : authCall(a => a.signOut()),
    /* GET /me → { user } (membre, référent, église ou administrateur connecté) */
    me: () => isDemo() ? demo(() => ({ user: Store.read().user })) : Http.get("/me")
  },

  /* ---------- Mon compte ---------- */
  account: {
    /* PATCH /me/profile { city, job, quote, about } → 204 (prénom, âge et église : modifiables par le référent seulement) */
    updateProfile: (payload) => isDemo() ? demo(() => null) : Http.patch("/me/profile", payload),
    /* PUT /me/photo { image: data URL JPEG } → { photo } : photo de profil (exigée), remplace la précédente */
    setPhoto: (image) => isDemo()
      ? demo(() => { Store.update(s => { s.user.photo = image; }); return { photo: image }; })
      : Http.put("/me/photo", { image }),
    /* DELETE /me/photo → 204 : retire la photo de profil (le tableau de bord rappelle d'en ajouter une) */
    removeMainPhoto: () => isDemo()
      ? demo(() => Store.update(s => { s.user.photo = null; }))
      : Http.del("/me/photo"),
    /* POST /me/photos { image } → 201 { photo } : photo facultative (3 au maximum, 422 au-delà) */
    addPhoto: (image) => isDemo()
      ? demo(() => { Store.update(s => { s.user.photos = (s.user.photos || []).concat(image).slice(0, 3); }); return { photo: image }; })
      : Http.post("/me/photos", { image }),
    /* DELETE /me/photos/:index → 204 (photo facultative) */
    removePhoto: (index) => isDemo()
      ? demo(() => Store.update(s => { s.user.photos = (s.user.photos || []).filter((_, i) => i !== index); }))
      : Http.del(`/me/photos/${Number(index)}`),
    /* PATCH /me/settings { suggestions?, paused? } → 204 */
    settings: (payload) => isDemo() ? demo(() => null) : Http.patch("/me/settings", payload),
    /* POST /me/charter → 204 : charte des échanges acceptée */
    acceptCharter: () => isDemo() ? demo(() => null) : Http.post("/me/charter"),
    /* POST /me/deletion-request → 204 (traitée sous 30 jours) */
    requestDeletion: () => isDemo() ? demo(() => null) : Http.post("/me/deletion-request"),
    /* GET /me/export → données du compte connecté (RGPD) */
    exportData: () => isDemo() ? demo(() => ({ exportedAt: new Date().toISOString(), state: Store.read() })) : Http.get("/me/export")
  },

  /* ---------- Inscription et églises ---------- */
  churches: {
    /* GET /churches?q= → Church[] (uniquement les églises partenaires actives) */
    list: (q = "") => isDemo()
      ? demo(() => CH.allChurches().filter(c => `${c.name} ${c.city}`.toLowerCase().includes(q.toLowerCase())))
      : Http.get(`/churches?q=${encodeURIComponent(q)}`),
    /* POST /church-requests { church, city, address, founded (AAAA-MM-JJ), denomination, contact, email, phone, referent, members, message } → { id } (publique) */
    requestPartnership: (payload) => isDemo()
      ? demo(() => { const id = "r" + Date.now(); Store.update(s => s.partnerRequests.unshift({ id, ...payload, status: "nouvelle" })); return { id }; })
      : Http.post("/church-requests", payload)
  },

  candidates: {
    /* POST /candidates { firstName, lastName, gender, age, city, job, about, answers: { faith, children, mobility, values[] },
       churchId, since, plan, sensitiveConsent: true } (après auth.signUp) → { status: "en_attente_validation" }
       422 sans consentement explicite au traitement des données religieuses (RGPD art. 9). */
    register: (payload) => isDemo()
      ? demo(() => { Store.update(s => { Object.assign(s.user, payload.user || {}); s.user.status = "en_attente_validation"; }); return { status: "en_attente_validation" }; })
      : Http.post("/candidates", payload)
  },

  /* ---------- Formule et paiement ---------- */
  payments: {
    /* POST /payments/checkout { plan: "single" | "cheminant", region: "europe" | "afrique", method }
       → { checkoutUrl } (page d'abonnement Stripe ou PayPal) ou, pour un moyen de paiement sans prestataire
       branché en mode « simulation », { status: "paye", payment }.
       Europe : Stripe (carte) ou PayPal ; Afrique : agrégateur Mobile Money (pas encore branché).
       403 tant que le profil n'est pas validé. Chaque échéance réglée (webhook signé ou retour du membre)
       renseigne member_profiles.paid_until et ouvre la messagerie. */
    checkout: (plan, method, region) => isDemo() ? demo(() => CH.subscribe(plan, method, region)) : Http.post("/payments/checkout", { plan, method, region }),
    /* POST /payments/confirm { provider: "stripe" | "paypal", ref } (au retour de la page du prestataire :
       ref = session Stripe « cs_… » ou abonnement PayPal « I-… ») → { status: "paye" | "en_attente" } */
    confirm: (provider, ref) => isDemo() ? demo(() => ({ status: "paye" })) : Http.post("/payments/confirm", { provider, ref }),
    /* POST /payments/cancel → { renews: false } : plus de renouvellement, la formule reste active jusqu'à paidUntil */
    cancel: () => isDemo() ? demo(() => { Store.update(s => { s.user.renews = false; }); return { renews: false }; }) : Http.post("/payments/cancel"),
    /* Lecture (état chargé par GET /state) → Payment[] (historique du membre connecté) */
    list: () => demo(() => Store.read().payments || [])
  },

  /* ---------- Profils ---------- */
  profiles: {
    /* Lecture (état chargé par GET /state) → ProfileSummary[] (sexe opposé, profils actifs) */
    search: () => demo(() => CH.visibleProfiles(Store.read())),
    /* Lecture (état chargé par GET /state) → Profile + convergences (jamais le score brut) */
    get: (id) => demo(() => CH.profile(id)),
    /* POST /profiles/:id/pass → 204 */
    pass: (id) => isDemo() ? demo(() => CH.pass(id)) : Http.post(`/profiles/${encodeURIComponent(id)}/pass`),
    /* POST /accompaniment-requests { profileId } → 201 */
    requestAccompaniment: (id) => isDemo() ? demo(() => CH.requestAccompaniment(id)) : Http.post("/accompaniment-requests", { profileId: id })
  },

  /* ---------- Intérêts et mise en relation ---------- */
  interests: {
    /* Lecture (état chargé par GET /state) → { sent: [], received: [], mutual: [] } */
    list: () => demo(() => Store.read().interests),
    /* POST /interests { profileId } → { status: "interet" | "relation" } (réciproque si l'autre l'a déjà manifesté) */
    express: (id) => isDemo() ? demo(() => ({ status: CH.expressInterest(id) })) : Http.post("/interests", { profileId: id })
  },

  /* ---------- Messagerie entre membres ----------
     Règle serveur : 403 si l'un des deux membres n'est pas validé (statut actif)
     ou n'est pas à jour de sa formule (paid_until), ou si l'un a bloqué l'autre. */
  chat: {
    /* Lecture (état chargé par GET /state) → [{ member: ProfileSummary, lastMessage, unread }] (plus récentes d'abord) */
    list: () => demo(() => CH.conversations(Store.read())),
    /* Lecture (état chargé par GET /state) → ProfileSummary[] + presence (membres joignables, les deux sexes) */
    members: (q = "") => demo(() => CH.chatMembers(Store.read()).filter(p => `${p.firstName} ${p.city}`.toLowerCase().includes(q.toLowerCase()))),
    /* Lecture (état chargé par GET /state) → Message[] { id, from, text, ts, react } */
    messages: (id) => demo(() => Store.read().messages[id] || []),
    /* POST /conversations/:memberId/messages { text } → Message (crée la conversation au premier message) */
    send: (id, text) => isDemo() ? demo(() => CH.postMessage(id, "me", text)) : Http.post(`/conversations/${encodeURIComponent(id)}/messages`, { text }),
    /* POST /conversations/:memberId/read → 204 */
    markRead: (id) => isDemo() ? demo(() => CH.markRead(id)) : Http.post(`/conversations/${encodeURIComponent(id)}/read`),
    /* PUT /messages/:messageId/reaction { key: "amen" | "merci" | "bravo" | null } → 204 */
    react: (messageId, key) => isDemo() ? demo(() => null) : Http.put(`/messages/${encodeURIComponent(messageId)}/reaction`, { key }),
    /* POST /members/:id/block → 204 ; DELETE /members/:id/block → 204 */
    block: (id) => isDemo() ? demo(() => Store.update(s => { if (!s.blocked.includes(id)) s.blocked.push(id); })) : Http.post(`/members/${encodeURIComponent(id)}/block`),
    unblock: (id) => isDemo() ? demo(() => Store.update(s => { s.blocked = s.blocked.filter(x => x !== id); })) : Http.del(`/members/${encodeURIComponent(id)}/block`),
    /* POST /reports { reportedId, reason, details, context, excerpt[] } → 201
       Transmis au référent de l'église du signalant ET à l'administrateur. L'auteur n'est jamais révélé au membre signalé. */
    report: (payload) => isDemo() ? demo(() => CH.submitReport(payload)) : Http.post("/reports", payload)
  },

  relations: {
    /* Lecture (état chargé par GET /state) → Message[] : même fil que /conversations/:memberId/messages */
    messages: (id) => demo(() => Store.read().messages[id] || []),
    /* POST /relations/:id/messages { text } → Message */
    send: (id, text) => isDemo()
      ? demo(() => { const msg = { from: "me", text, time: "À l'instant" }; Store.update(s => (s.messages[id] = s.messages[id] || []).push(msg)); return msg; })
      : Http.post(`/conversations/${encodeURIComponent(id)}/messages`, { text }),
    /* Lecture (état chargé par GET /state) → { start, unlockAt, unlocked, me, them } */
    cheminant: (id) => demo(() => CH.cheminantStatus(Store.read(), id)),
    /* POST /relations/:memberId/discernment { step, done } → 204 (étapes de discernement cochées) */
    discernment: (id, step, done) => isDemo() ? demo(() => null) : Http.post(`/relations/${encodeURIComponent(id)}/discernment`, { step, done }),
    /* POST /relations/:id/advance → { status: "en_attente_partenaire" | "couple_en_cheminement" }
       Activation par le membre connecté, depuis son profil. 403 tant que 3 mois ne se sont pas
       écoulés depuis la mise en relation ; le couple n'est créé que lorsque les deux ont activé. */
    advance: (id) => isDemo()
      ? demo(() => ({ status: { active: "couple_en_cheminement", en_attente: "en_attente_partenaire" }[CH.activateCheminant(id)] || "verrouille" }))
      : Http.post(`/relations/${encodeURIComponent(id)}/advance`)
  },

  /* ---------- École du mariage ---------- */
  courses: {
    /* Lecture (data.courses de GET /state) → { [moduleId]: [{ id, title, type: "video" | "audio", minutes, speaker, description, url }] }
       url : lien de lecture (GET /media/:jeton, redirigé vers le stockage), null pour un module pas encore ouvert. */
    list: () => demo(() => CH_DATA.courses),
    /* Lecture (état chargé par GET /state) → { me: { [moduleId]: courseId[] }, partner: { … } } (couple connecté) */
    progress: () => demo(() => Store.read().courses),
    /* POST /school/courses/:courseId/watched → 204 (403 si le module n'est pas encore ouvert) */
    markWatched: (moduleId, courseId) => isDemo()
      ? demo(() => CH.markLesson(moduleId, courseId))
      : Http.post(`/school/courses/${encodeURIComponent(courseId)}/watched`)
  },
  school: {
    /* Lecture (état chargé par GET /state) → { [moduleId]: lessonIndex[] } */
    progress: () => demo(() => Store.read().modules),
    /* POST /school/modules/:id/lessons/:index/complete { notes? } → 204 (403 si le module précédent n'est pas terminé) */
    completeLesson: (moduleId, index, notes) => isDemo()
      ? demo(() => Store.update(s => { const l = (s.modules[moduleId] = s.modules[moduleId] || []); if (!l.includes(index)) l.push(index); }))
      : Http.post(`/school/modules/${moduleId}/lessons/${index}/complete`, notes === undefined ? {} : { notes })
  },

  /* ---------- Accompagnement et préparation au mariage (couple en cheminement) ---------- */
  prep: {
    /* POST /prep/sessions/:index → 204 */
    session: (index) => isDemo() ? demo(() => null) : Http.post(`/prep/sessions/${index}`),
    /* PUT /prep/tasks/:index { done } → 204 */
    task: (index, done) => isDemo() ? demo(() => null) : Http.put(`/prep/tasks/${index}`, { done }),
    /* PUT /prep/wedding { weddingDate?, married? } → 204 */
    wedding: (payload) => isDemo() ? demo(() => null) : Http.put("/prep/wedding", payload)
  },

  /* ---------- Notifications ---------- */
  notifications: {
    /* Lecture (état chargé par GET /state) → Notification[] */
    list: () => demo(() => CH.notifications(Store.read())),
    /* POST /me/read-notifs { ids } → 204 */
    markRead: (ids) => isDemo()
      ? demo(() => Store.update(s => { s.readNotifs = [...new Set(s.readNotifs.concat(ids))]; }))
      : Http.post("/me/read-notifs", { ids })
  },

  /* ---------- Espace référent ---------- */
  referent: {
    /* Lecture (état chargé par GET /state) → Candidate[] (uniquement ceux de son église) */
    candidates: () => demo(() => Store.read().candidates),
    /* POST /referent/candidates/:id/interview { date, place } → { interview: "planifie" } */
    planInterview: (id, payload) => isDemo()
      ? demo(() => Store.update(s => { s.candidates[id] = { ...(s.candidates[id] || {}), interview: "planifie", ...payload }; }))
      : Http.post(`/referent/candidates/${encodeURIComponent(id)}/interview`, payload),
    /* POST /referent/candidates/:id/interview-done → { interview: "realise" } */
    interviewDone: (id) => isDemo() ? demo(() => null) : Http.post(`/referent/candidates/${encodeURIComponent(id)}/interview-done`),
    /* POST /referent/candidates/:id/decision { decision, internalNote, message } — internalNote n'est jamais renvoyée au candidat.
       « valider » active le profil et crée l'inscription validée et ses reversements (calcul serveur). */
    decide: (id, decision, internalNote = "", message = "") => isDemo()
      ? demo(() => Store.update(s => { s.candidates[id] = { ...(s.candidates[id] || {}), decision }; }))
      : Http.post(`/referent/candidates/${encodeURIComponent(id)}/decision`, { decision, internalNote, message }),
    /* Lecture (état chargé par GET /state) → [{ couple, progress: [pctA, pctB], module, lastActivity }] (couples de son église) */
    school: () => demo(() => CH.schoolCouples(Store.read(), "c1")),
    /* Lecture (état chargé par GET /state) → Report[] (uniquement ceux impliquant un membre de son église) */
    reports: () => demo(() => CH.reportsForChurch(Store.read(), "c1")),
    /* POST /referent/reports/:id/note { note } → 204 (avis consultatif transmis à l'administrateur) */
    noteReport: (id, note) => isDemo()
      ? demo(() => Store.update(s => { s.reports.find(r => r.id === id).referentNote = note; }))
      : Http.post(`/referent/reports/${encodeURIComponent(id)}/note`, { note }),
    /* Lecture (état chargé par GET /state) → { lines: [{ candidate, validatedAt, plan, amount, currency }] }
       Uniquement les inscriptions validées par le référent connecté et uniquement sa part (10 % du HT).
       Jamais le prix TTC, le montant HT, la part de l'église ni celle d'un autre référent. */
    reversements: () => demo(() => ({ lines: CH.referentEarnings(CH_DATA.demoReferentId).map(l => ({ candidate: l.name, validatedAt: l.validatedAt, plan: l.plan, amount: l.amount, currency: l.currency })) }))
  },

  /* ---------- Espace église ---------- */
  church: {
    /* Lecture (état chargé par GET /state) → { lines: [{ candidate, validatedAt, plan, referent, amount, currency }] }
       Inscriptions validées par TOUS les référents de l'église du compte connecté, uniquement la part
       de l'église (10 % du HT). Jamais le prix TTC, le montant HT ni la part d'un référent. */
    reversements: () => demo(() => ({ lines: CH.churchEarnings("c1").map(l => ({ candidate: l.name, validatedAt: l.validatedAt, plan: l.plan, referent: l.referent, amount: l.amount, currency: l.currency })) })),
    /* Lecture (état chargé par GET /state) → [{ id, name, email, role, trained }] (référents de l'église du compte connecté) */
    referents: () => demo(() => CH.referentsOf("c1")),
    /* POST /church/referents { name, email, role } → { id } ; pas de limite de nombre.
       Le serveur crée l'invitation et l'entrée church_referents de l'église du compte connecté. */
    addReferent: (payload) => isDemo()
      ? demo(() => Store.update(s => { s.extraReferents.push({ id: `xr-${Date.now()}`, churchId: "c1", ...payload, trained: false }); }))
      : Http.post("/church/referents", payload),
    /* POST /church/referents/:id/resend → 204 (nouveau lien de création du mot de passe) */
    resendInvite: (id) => isDemo() ? demo(() => null) : Http.post(`/church/referents/${encodeURIComponent(id)}/resend`),
    /* DELETE /church/referents/:id → 204 (uniquement un référent de l'église du compte connecté).
       Ses validations et reversements passés sont conservés. */
    removeReferent: (id) => isDemo() ? demo(() => CH.removeReferent(id)) : Http.del(`/church/referents/${encodeURIComponent(id)}`)
  },

  /* ---------- Administration ---------- */
  admin: {
    /* Lecture (état chargé par GET /state) → toutes les inscriptions validées et leur répartition
       (TTC, taxes, HT, part référent, part église, part Cheminons). Super administrateur uniquement. */
    ledger: () => demo(() => CH.ledger()),
    /* Lecture (état chargé par GET /state) → progression de tous les couples à l'École du mariage */
    school: () => demo(() => CH.schoolCouples(Store.read())),
    /* Lecture (état chargé par GET /state) → Report[] + historique des sanctions du membre signalé */
    reports: () => demo(() => Store.read().reports),
    /* POST /admin/reports/:id/decision { decision: "avertissement" | "suspension" | "desactivation" | "classe", days?, note? }
       Super administrateur uniquement. suspension : days >= 2. desactivation : 422 sans sanction antérieure (récidive). */
    decideReport: (id, decision, opts) => isDemo()
      ? demo(() => CH.decideReport(id, decision, opts))
      : Http.post(`/admin/reports/${encodeURIComponent(id)}/decision`, { decision, ...opts }),
    /* POST /admin/members/:id/lift-suspension → 204 */
    liftSuspension: (id) => isDemo() ? demo(() => CH.liftSuspension(id)) : Http.post(`/admin/members/${encodeURIComponent(id)}/lift-suspension`),
    /* POST /admin/members/:id/purge → 204 (membre ayant demandé la suppression de son compte ; 422 sinon)
       Efface photos, profil, échanges et progression ; conserve, pseudonymisés, paiements, reversements et signalements. */
    purgeMember: (id) => isDemo() ? demo(() => null) : Http.post(`/admin/members/${encodeURIComponent(id)}/purge`),
    /* Lecture (état chargé par GET /state) → ChurchRequest[] */
    churchRequests: () => demo(() => Store.read().partnerRequests),
    /* POST /admin/church-requests/:id/questions { questions: string[], message } → 204
       Envoie les questions au responsable de l'église ; la demande passe au statut « precisions ». */
    askChurchRequest: (id, questions, message) => isDemo()
      ? demo(() => Store.update(s => Object.assign(s.partnerRequests.find(r => r.id === id), { status: "precisions", questions, message })))
      : Http.post(`/admin/church-requests/${encodeURIComponent(id)}/questions`, { questions, message }),
    /* PATCH /admin/church-requests/:id { status: "acceptee" | "declinee", region? } → { churchId }
       « acceptee » crée l'église et invite son responsable (compte « église ») par e-mail. */
    reviewChurchRequest: (id, status, region) => isDemo()
      ? demo(() => Store.update(s => { const r = s.partnerRequests.find(x => x.id === id); if (r) r.status = status; }))
      : Http.patch(`/admin/church-requests/${encodeURIComponent(id)}`, { status, region }),
    /* POST /admin/referents { name, email, churchId, role } → { id } (invitation par e-mail) */
    addReferent: (payload) => isDemo() ? demo(() => null) : Http.post("/admin/referents", payload),
    /* POST /admin/referents/:id/resend → 204 */
    resendInvite: (id) => isDemo() ? demo(() => null) : Http.post(`/admin/referents/${encodeURIComponent(id)}/resend`),
    /* DELETE /admin/referents/:id → 204 (retire le référent de son église) */
    removeReferent: (id) => isDemo() ? demo(() => CH.removeReferent(id)) : Http.del(`/admin/referents/${encodeURIComponent(id)}`),
    /* DELETE /admin/churches/:id → 204 ; 409 si des membres y sont rattachés. Ses référents sont retirés. */
    removeChurch: (id) => isDemo() ? demo(() => CH.removeChurch(id)) : Http.del(`/admin/churches/${encodeURIComponent(id)}`),

    /* ---------- Cours de l'École du mariage (#/cours) ----------
       Lecture : data.courses de GET /state (tous les modules, avec url et position).
       Envoi d'un fichier en deux temps : POST /admin/courses/upload { moduleId, type: "audio" | "video" }
       → { path, signedUrl, contentType }, puis dépôt du fichier directement dans le bucket « courses »
       (PUT sur signedUrl, 50 Mo au plus). onProgress(0..1) suit l'envoi. Résout avec path. */
    uploadCourseFile: async (moduleId, type, file, onProgress) => {
      if (isDemo()) throw new ApiError("L'envoi de fichiers nécessite la connexion à Supabase.", 0);
      const { path, signedUrl, contentType } = await Http.post("/admin/courses/upload", { moduleId, type });
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("apikey", CH_CONFIG.supabaseAnonKey);
        xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
        xhr.onload = () => xhr.status < 300 ? resolve()
          : reject(new ApiError(xhr.status === 413 ? "Ce fichier est trop lourd (50 Mo au plus)." : "L'envoi du fichier a échoué. Merci de réessayer.", xhr.status));
        xhr.onerror = () => reject(new ApiError("L'envoi du fichier a échoué. Vérifiez votre connexion internet.", 0));
        xhr.send(file);
      });
      return path;
    },
    /* POST /admin/courses/discard { path } → 204 (fichier envoyé puis abandonné, s'il n'est utilisé par aucun cours) */
    discardCourseFile: (path) => isDemo() ? demo(() => null) : Http.post("/admin/courses/discard", { path }),
    /* POST /admin/courses { moduleId, title, speaker, description, minutes, type, path } → { id } (ajouté en fin de module) */
    addCourse: (payload) => Http.post("/admin/courses", payload),
    /* PATCH /admin/courses/:id { moduleId, title, speaker, description, minutes, type?, path? } → 204
       path : nouveau fichier (l'ancien est supprimé). Changer de module place le cours en fin du nouveau module. */
    updateCourse: (id, payload) => Http.patch(`/admin/courses/${encodeURIComponent(id)}`, payload),
    /* POST /admin/courses/:id/move { direction: "up" | "down" } → 204 */
    moveCourse: (id, direction) => Http.post(`/admin/courses/${encodeURIComponent(id)}/move`, { direction }),
    /* DELETE /admin/courses/:id → 204 (supprime aussi le fichier et la progression liée) */
    removeCourse: (id) => Http.del(`/admin/courses/${encodeURIComponent(id)}`)
  }
};
