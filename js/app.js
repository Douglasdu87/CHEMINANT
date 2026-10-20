/* =========================================================
   CHEMINONS — routeur de l'application monopage
   Adresses : #/<vue>[/<section>][?param=valeur]
     #/                      accueil
     #/accueil/faq           accueil, défilé jusqu'à la section #faq
     #/profil?id=p1          fiche du profil p1
   Le routage par « # » fonctionne aussi en ouvrant index.html
   directement depuis le disque (file://), sans serveur.
   ========================================================= */

const App = {
  views: {},
  current: null,   // { name, query, section }
  signal: null,    // AbortSignal de la vue affichée
  _controller: null,
  _leave: [],

  /* Déclare une vue : { layout, title, mainClass?, template(), init(ctx)? } */
  view(name, def) { this.views[name] = def; },

  /* Écouteur posé sur document, retiré automatiquement quand on quitte la vue */
  onDocument(type, handler) {
    document.addEventListener(type, handler, { signal: this.signal });
  },

  /* Analyse location.hash → { name, section, query } */
  parse(hash = location.hash) {
    const raw = hash.replace(/^#\/?/, "");
    const [path, qs = ""] = raw.split("?");
    const [name = "", section = ""] = path.split("/").filter(Boolean);
    return { name: name || "accueil", section, query: new URLSearchParams(qs) };
  },

  go(path) { location.hash = path.startsWith("#") ? path : "#/" + path; },

  render() {
    const hash = location.hash;
    /* Les ancres internes (#main…) ne sont pas des routes */
    if (hash && !hash.startsWith("#/")) return;

    const route = this.parse(hash);
    const view = this.views[route.name] ? route.name : "introuvable";
    const def = this.views[view];

    /* Mode supabase : chaque espace est réservé au rôle du compte connecté */
    if (Remote.on && !Remote.allows(def.layout || "public")) {
      const next = Remote.role ? Remote.home() : `#/connexion?suite=${encodeURIComponent(hash.replace(/^#/, ""))}`;
      if (next.split("?")[0] !== hash.split("?")[0]) { location.replace(next); return; }
    }
    if (Remote.on && Remote.role === "membre" && Remote.needsProfile && def.layout === "app") {
      location.replace("#/inscription");
      return;
    }
    const sameView = this.current && this.current.name === view
      && this.current.query.toString() === route.query.toString();

    if (sameView) {
      /* Même page, autre section : on se contente de défiler */
      this.current = { ...route, name: view };
      this.scrollTo(route.section, true);
      Layout.markCurrent();
      return;
    }

    /* Nettoyage de la vue précédente */
    this._controller?.abort();
    this._leave.forEach(fn => { try { fn(); } catch (e) { /* ignoré */ } });
    this._leave = [];
    this._controller = new AbortController();
    this.signal = this._controller.signal;
    document.querySelectorAll(".modal.is-open").forEach(m => m.classList.remove("is-open"));

    this.current = { ...route, name: view };
    try {
      Layout.render(def.layout);
    } catch (err) {
      console.error("[Cheminons] Erreur dans l'en-tête", err);   // la page doit s'afficher malgré tout
    }

    const root = document.getElementById("view");
    root.innerHTML = `<main id="main" class="${def.mainClass || ""}" tabindex="-1">${def.template()}</main>`;
    document.title = view === "accueil" ? "Cheminons | Rencontre chrétienne validée par votre église" : `${def.title} | Cheminons`;
    hydrateIcons(root);

    const ctx = {
      signal: this.signal,
      query: route.query,
      param: key => route.query.get(key),
      onLeave: fn => this._leave.push(fn)
    };
    try {
      def.init?.call(def, ctx);
    } catch (err) {
      console.error(`[Cheminons] Erreur dans la vue « ${view} »`, err);
    }
    hydrateIcons(root);
    enhancePasswords(root);

    /* Accessibilité : on annonce la nouvelle page et on y place le focus */
    const heading = root.querySelector("h1");
    const announcer = document.getElementById("route-announcer");
    if (announcer) announcer.textContent = heading ? heading.textContent.trim() : def.title;
    if (heading) heading.setAttribute("tabindex", "-1");
    if (this._started) (heading || root.querySelector("main")).focus({ preventScroll: true });

    if (route.section) this.scrollTo(route.section);
    else window.scrollTo({ top: 0, behavior: "instant" });
    this._started = true;
  },

  /* smooth : uniquement pour une section de la page déjà affichée */
  scrollTo(section, smooth = false) {
    if (!section) return;
    const target = document.getElementById(section);
    if (!target) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: smooth && !reduce ? "smooth" : "instant" });
  },

  async start() {
    if (Remote.on) await Remote.boot();
    window.addEventListener("hashchange", () => this.render());
    /* Déconnexion : tout lien ou bouton portant data-logout */
    document.addEventListener("click", e => {
      const out = e.target.closest("[data-logout]");
      if (!out) return;
      e.preventDefault();
      if (Remote.on) Remote.logout();
      else location.hash = "#/";
    });
    this.render();
  }
};

/* Page introuvable */
App.view("introuvable", {
  layout: "public",
  title: "Page introuvable",
  template: () => `
    <section class="section">
      <div class="container narrow">
        <p class="kicker">Erreur 404</p>
        <h1>Ce chemin n'existe pas.</h1>
        <p class="lead">La page demandée a peut-être été déplacée. Reprenons depuis le début.</p>
        <p><a class="btn btn--primary" href="#/">Revenir à l'accueil</a></p>
      </div>
    </section>`
});
