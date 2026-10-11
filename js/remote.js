/* =========================================================
   CHEMINANT — synchronisation avec Supabase (mode "supabase")
   L'état du compte connecté vient de GET /state : même forme que l'état de
   démo (js/store.js), limité par le serveur à ce que ce compte a le droit de
   voir. Les écrans le lisent toujours via Store.read() et CH.

   Une action met d'abord l'écran à jour (Store.update), puis part vers
   l'Edge Function par Remote.push(() => Api.…) : le serveur applique les
   règles métier, puis l'état est rechargé. En mode démo, push ne fait rien.
   ========================================================= */

const PENDING_KEY = "cheminant-inscription-en-attente";

const Remote = {
  on: CH_CONFIG.dataSource === "supabase",
  role: null,            // membre | referent | eglise | admin ; null si déconnecté
  state: null,           // état du compte (forme de l'état de démo)
  data: {},              // collections propres au compte (profils, candidats, reversements…)
  email: null,
  needsProfile: false,   // compte créé, candidature pas encore envoyée
  _timer: null,

  /* Démarrage : session éventuelle (y compris retour d'un lien reçu par e-mail) */
  async boot() {
    const hash = location.hash;
    const fromEmail = /access_token=|error_description=/.test(hash);
    const params = new URLSearchParams(hash.replace(/^#\/?/, ""));
    const type = fromEmail ? (params.get("type") || (params.get("error_description") ? "erreur" : "")) : "";
    try {
      const client = await Supa.client();   // lit le jeton présent dans l'adresse
      this.setChurches(await Api.churches.list().catch(() => []));
      const { data } = await client.auth.getSession();
      if (data.session) await this.refresh().catch(() => this.clear());
      client.auth.onAuthStateChange(event => { if (event === "SIGNED_OUT") this.clear(); });
    } catch (err) {
      console.error("[Cheminant] Connexion au serveur impossible", err);
    }
    if (fromEmail) {
      history.replaceState(null, "", location.pathname + location.search);
      location.hash = type === "erreur" ? "#/connexion?erreur=lien"
        : ["invite", "recovery"].includes(type) ? "#/mot-de-passe" : this.home();
    }
    await this.completeRegistration();
    this.poll();
  },

  /* Recharge l'état du compte connecté */
  async refresh() {
    this.apply(await Api.state());
  },

  apply(payload) {
    this.role = payload.role;
    this.email = payload.email || null;
    this.needsProfile = Boolean(payload.needsProfile);
    this.state = Object.assign(emptyState(), payload.state);
    this.data = payload.data || {};
    const d = this.data;
    if (d.churches) this.setChurches(d.churches);
    /* Les helpers CH lisent ces collections : elles viennent désormais du serveur */
    CH_DATA.profiles = d.profiles || [];
    CH_DATA.candidates = d.candidates || [];
    CH_DATA.referents = d.referents || [];
    CH_DATA.couples = d.couples || [];
    CH_DATA.registrationsHistory = [];
    CH_DATA.demoReferentId = this.state.user?.id || null;
    document.dispatchEvent(new Event("cheminant:change"));
    document.dispatchEvent(new Event("cheminant:remote"));
  },

  setChurches(list) {
    if (Array.isArray(list) && list.length) CH_DATA.churches = list;
  },

  clear() {
    this.role = null;
    this.state = null;
    this.data = {};
    this.needsProfile = false;
    CH_DATA.profiles = [];
    CH_DATA.candidates = [];
    CH_DATA.referents = [];
    CH_DATA.couples = [];
  },

  /* Page d'accueil de chaque rôle */
  home(role = this.role) {
    if (role === "membre" && this.needsProfile) return "#/inscription";
    return { membre: "#/tableau-de-bord", referent: "#/referent", eglise: "#/eglise", admin: "#/admin" }[role] || "#/connexion";
  },

  /* Espace (layout) autorisé pour chaque rôle */
  allows(layout) {
    if (layout === "public") return true;
    return { app: "membre", referent: "referent", eglise: "eglise", admin: "admin" }[layout] === this.role;
  },

  /* Action côté serveur après la mise à jour immédiate de l'écran.
     En cas de refus, le message du serveur s'affiche et l'état est rechargé. */
  push(fn) {
    if (!this.on) return Promise.resolve(null);
    return fn()
      .then(res => { this.refresh().catch(() => {}); return res; })
      .catch(err => {
        toast(err.message || "Une erreur est survenue. Merci de réessayer.");
        this.refresh().catch(() => {});
        return null;
      });
  },

  /* Nouveaux messages, décisions… : rechargement régulier tant que la page est visible */
  poll() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (this.role && document.visibilityState === "visible") this.refresh().catch(() => {});
    }, CH_CONFIG.pollMs || 15000);
    document.addEventListener("visibilitychange", () => {
      if (this.role && document.visibilityState === "visible") this.refresh().catch(() => {});
    });
  },

  /* Inscription commencée avant la confirmation de l'adresse e-mail */
  savePending(payload) {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch (e) { /* ignoré */ }
  },
  async completeRegistration() {
    if (this.role !== "membre" || !this.needsProfile) return;
    let payload = null;
    try { payload = JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (e) { /* ignoré */ }
    if (!payload) return;
    try {
      await Api.candidates.register(payload);
      try { localStorage.removeItem(PENDING_KEY); } catch (e) { /* ignoré */ }
      await this.refresh();
      if (location.hash.startsWith("#/inscription")) location.hash = "#/tableau-de-bord";
    } catch (err) {
      console.error(err);
    }
  },

  async logout() {
    try { await Api.auth.logout(); } catch (e) { /* session déjà close */ }
    this.clear();
    location.hash = "#/connexion";
  }
};
