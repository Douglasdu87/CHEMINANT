/* =========================================================
   CHEMINANT — en-tête, pied de page, icônes, toasts, modales
   Rendus par Layout.render(layout), appelé par le routeur (js/app.js)
   ========================================================= */

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  church: '<path d="M12 2v4M10 4h4"/><path d="M6 22V11l6-5 6 5v11"/><path d="M10 22v-5a2 2 0 0 1 4 0v5"/><path d="M2 22h20"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  ring: '<circle cx="12" cy="14" r="7"/><path d="m9 3 3 4 3-4"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  hands: '<path d="M7 11V5a2 2 0 0 1 4 0v6"/><path d="M11 10V4a2 2 0 0 1 4 0v7"/><path d="M15 9a2 2 0 0 1 4 0v5a8 8 0 0 1-8 8h-1a7 7 0 0 1-5-2l-3.4-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
  audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/>',
  quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  pray: '<path d="M12 3c-1 2-4 6-4 10v6l4-2 4 2v-6c0-4-3-8-4-10z"/><path d="M12 3v14"/>',
  map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6A17.6 17.6 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>'
};

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

const LOGO_SRC = "public/logo-cheminant.png";

function logo(href = "#/", size = "") {
  return `<a class="logo ${size ? "logo--" + size : ""}" href="${href}" aria-label="Cheminant, accueil">
    <img class="logo__img" src="${LOGO_SRC}" alt="" width="240" height="170" decoding="async"></a>`;
}

const NAVS = {
  public: [
    ["#/accueil/parcours", "Le parcours"],
    ["#/accueil/validation", "Validation par l'église"],
    ["#/accueil/ecole", "École du mariage"],
    ["#/transparence", "Transparence"],
    ["#/eglise-partenaire", "Églises"],
    ["#/accueil/tarifs", "Tarifs"]
  ],
  app: [
    ["#/tableau-de-bord", "Tableau de bord"],
    ["#/recherche", "Découvrir"],
    ["#/interets", "Intérêts"],
    ["#/messages", s => {
      const n = CH.unreadTotal(s);
      return `Messages${n ? ` <span class="nav-count">${n}<span class="sr-only"> non lu${n > 1 ? "s" : ""}</span></span>` : ""}`;
    }],
    ["#/cheminement", "Notre cheminement"],
    ["#/ecole", "École du mariage", s => CH.schoolActive(s)],
    ["#/preparation", "Vers le mariage"]
  ],
  referent: [
    ["#/referent", "Candidats"],
    ["#/referent/entretiens", "Entretiens"],
    ["#/referent/couples", "Couples suivis"],
    ["#/referent/signalements", "Signalements"],
    ["#/referent/reversements", "Mes reversements"]
  ],
  eglise: [
    ["#/eglise", "Reversements"],
    ["#/eglise/referents", "Référents"]
  ],
  admin: [
    ["#/admin", "Vue d'ensemble"],
    ["#/finances", "Flux financiers"],
    ["#/admin/signalements", s => {
      const n = s.reports.filter(r => r.status !== "traite").length;
      return `Signalements${n ? ` <span class="nav-count">${n}<span class="sr-only"> à traiter</span></span>` : ""}`;
    }],
    ["#/admin/ecole", "École du mariage"],
    ["#/admin/demandes", "Demandes d'adhésion"],
    ["#/admin/eglises", "Églises"],
    ["#/admin/referents", "Référents"]
  ]
};

const Layout = {
  current: null,
  _controller: null,

  /* (Re)construit l'en-tête quand on change d'espace (public, membre, référent, admin) */
  render(layout = "public") {
    if (!document.getElementById("site-footer").hasChildNodes()) renderFooter();
    const key = `${layout}|${Remote.role || ""}`;   // l'en-tête public change une fois connecté
    if (key === this.current) { this.markCurrent(); return; }
    this.current = key;
    this._controller?.abort();
    this._controller = new AbortController();
    renderHeader(layout, this._controller.signal);
    this.markCurrent();
  },

  /* Lien actif + fermeture du menu mobile après navigation */
  markCurrent() {
    const header = document.getElementById("site-header");
    const hash = location.hash || "#/";
    header.querySelectorAll(".nav a, .mobile-nav a").forEach(a => {
      const href = a.getAttribute("href");
      if (href === hash.split("?")[0]) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    header.querySelector(".mobile-nav")?.classList.remove("is-open");
    header.querySelector(".burger")?.setAttribute("aria-expanded", "false");
  }
};

/* Liens visibles pour l'espace courant (certains dépendent de l'état du membre) */
function navLinks(layout) {
  const s = Store.read();
  return NAVS[layout].filter(([, , visible]) => !visible || visible(s))
    .map(([href, label]) => `<a href="${href}">${typeof label === "function" ? label(s) : label}</a>`).join("");
}

function renderHeader(layout, signal) {
  const links = navLinks(layout);

  let actions;
  if (layout === "public" && Remote.role) {
    /* Mode supabase : compte connecté sur une page publique */
    actions = `<a class="btn btn--primary btn--sm" href="${Remote.home()}">Mon espace</a>
               <a class="icon-btn hide-mobile" href="#/" data-logout aria-label="Se déconnecter" title="Se déconnecter">${icon("logout", 18)}</a>`;
  } else if (layout === "public") {
    actions = `<a class="btn btn--ghost btn--sm hide-mobile" href="#/connexion">Se connecter</a>
               <a class="btn btn--primary btn--sm" href="#/inscription">S'inscrire</a>`;
  } else if (layout === "app") {
    const s = Store.read();
    const name = `${s.user.firstName} ${s.user.lastName}`;
    actions = `<div class="notif">
                 <button class="icon-btn" id="notif-btn" aria-expanded="false" aria-controls="notif-panel">${icon("bell")}<span class="notif__count" id="notif-count" hidden></span></button>
                 <div class="notif__panel" id="notif-panel" hidden></div>
               </div>
               <a class="user-chip" href="#/mon-profil" aria-label="Mon profil">${CH.avatar(name, s.user.colors, "sm", s.user.photo)}<span class="user-chip__name">${CH.escape(s.user.firstName)}</span></a>
               <a class="icon-btn hide-mobile" href="#/" data-logout aria-label="Se déconnecter" title="Se déconnecter">${icon("logout", 18)}</a>`;
  } else {
    const label = { admin: "Administration", referent: "Espace référent", eglise: "Espace église" }[layout];
    actions = `<span class="role-tag">${icon(layout === "admin" ? "shield" : "church", 14)} ${label}</span>
               <a class="icon-btn hide-mobile" href="#/" data-logout aria-label="Se déconnecter" title="Se déconnecter">${icon("logout", 18)}</a>`;
  }

  const header = document.getElementById("site-header");
  header.className = `header header--${layout}`;
  header.innerHTML = `
    <div class="container header__inner">
      ${logo("#/")}
      <nav class="nav" aria-label="Navigation principale">${links}</nav>
      <div class="header__actions">
        ${actions}
        <button class="icon-btn burger" aria-label="Menu" aria-expanded="false" aria-controls="mobile-nav">${icon("menu")}</button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Navigation mobile">
      <div class="container">${links}
        ${layout === "public" ? (Remote.role ? `<a href="${Remote.home()}">Mon espace</a>` : '<a href="#/connexion">Se connecter</a>') : '<a href="#/">Accueil du site</a><a href="#/" data-logout>Se déconnecter</a>'}
      </div>
    </nav>`;

  if (layout === "app") setupNotifications(signal);
  if (layout !== "public") {
    /* Met le menu à jour après chaque action (module activé, compteurs de messages ou de signalements) */
    document.addEventListener("cheminant:change", () => {
      const fresh = navLinks(layout);
      const nav = header.querySelector(".nav");
      if (nav.innerHTML === fresh) return;
      nav.innerHTML = fresh;
      header.querySelector(".mobile-nav .container").querySelectorAll('a[href]:not([href="#/"])').forEach(a => a.remove());
      header.querySelector(".mobile-nav .container").insertAdjacentHTML("afterbegin", fresh);
      Layout.markCurrent();
    }, { signal });
  }

  const burger = header.querySelector(".burger");
  const mobile = header.querySelector(".mobile-nav");
  burger.addEventListener("click", () => {
    const open = mobile.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });
}

/* ---------- Notifications (espace membre) ---------- */
function setupNotifications(signal) {
  const btn = document.getElementById("notif-btn");
  const panel = document.getElementById("notif-panel");
  const count = document.getElementById("notif-count");

  function render() {
    const s = Store.read();
    const list = CH.notifications(s);
    const unread = list.filter(n => !s.readNotifs.includes(n.id)).length;
    count.hidden = unread === 0;
    count.textContent = unread;
    btn.setAttribute("aria-label", unread ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications");
    panel.innerHTML = `
      <div class="notif__head"><strong>Notifications</strong>${unread ? '<button class="notif__all" type="button">Tout marquer comme lu</button>' : ""}</div>
      ${list.length ? `<ul>${list.map(n => `
        <li><a href="${n.href}" data-notif="${n.id}" class="${s.readNotifs.includes(n.id) ? "" : "is-unread"}">
          <span class="notif__icon">${icon(n.icon, 16)}</span><span>${CH.escape(n.text)}</span></a></li>`).join("")}</ul>`
        : '<p class="small muted" style="padding:16px">Aucune notification.</p>'}`;
  }

  function markRead(ids) {
    Store.update(s => { s.readNotifs = [...new Set(s.readNotifs.concat(ids))]; });
    Remote.push(() => Api.notifications.markRead(ids));
  }
  function toggle(open) {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open);
    if (open) { render(); panel.querySelector("a, button")?.focus(); }
  }

  btn.addEventListener("click", e => { e.stopPropagation(); toggle(panel.hidden); });
  panel.addEventListener("click", e => {
    e.stopPropagation();
    const link = e.target.closest("[data-notif]");
    if (link) { markRead([link.dataset.notif]); toggle(false); }
    if (e.target.closest(".notif__all")) {
      markRead(CH.notifications(Store.read()).map(n => n.id));
      render();
      btn.focus();
    }
  });
  document.addEventListener("click", () => toggle(false), { signal });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !panel.hidden) { toggle(false); btn.focus(); }
  }, { signal });
  document.addEventListener("cheminant:change", render, { signal }); // compteur à jour après chaque action
  render();
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  footer.className = "footer";
  footer.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          ${logo("#/", "lg")}
          <p>Une plateforme chrétienne de rencontre, de discernement et de préparation au mariage, où chaque profil est validé par un référent de son église.</p>
        </div>
        <div>
          <h2 class="footer__title">Plateforme</h2>
          <ul>
            <li><a href="#/accueil/parcours">Le parcours</a></li>
            <li><a href="#/accueil/ecole">École du mariage</a></li>
            <li><a href="#/accueil/tarifs">Tarifs</a></li>
            <li><a href="#/inscription">Créer mon profil</a></li>
            <li><a href="#/connexion">Se connecter</a></li>
          </ul>
        </div>
        <div>
          <h2 class="footer__title">Églises</h2>
          <ul>
            <li><a href="#/eglise-partenaire">Devenir église partenaire</a></li>
            <li><a href="#/referent">Espace référent</a></li>
            <li><a href="#/eglise">Espace église</a></li>
          </ul>
        </div>
        <div>
          <h2 class="footer__title">Confiance</h2>
          <ul>
            <li><a href="#/transparence">Fonctionnement de la compatibilité</a></li>
            <li><a href="#/transparence/donnees">Données personnelles</a></li>
            <li><a href="#/accueil/faq">Questions fréquentes</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 Cheminant${Remote.on ? "" : " · Prototype de démonstration"}</span>
        ${Remote.on ? "" : '<button type="button" class="link-btn" id="reset-demo">Réinitialiser la démo</button>'}
      </div>
    </div>`;
  footer.querySelector("#reset-demo")?.addEventListener("click", () => {
    Store.reset();
    toast("Démo réinitialisée");
    setTimeout(() => { location.hash = "#/"; location.reload(); }, 700);
  });
}

/* ---------- Toast ---------- */
function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-visible"), 2800);
}

/* ---------- Modale ---------- */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add("is-open");
  m._returnFocus = document.activeElement;
  const focusable = m.querySelector("input, textarea, select, button:not(.modal__close)");
  if (focusable) focusable.focus();
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove("is-open");
  if (m._returnFocus) m._returnFocus.focus();
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-skip]")) {
    e.preventDefault();
    document.getElementById("main")?.focus();
  }
  const closer = e.target.closest("[data-close]");
  if (closer) closeModal(closer.closest(".modal").id);
  if (e.target.classList.contains("modal")) closeModal(e.target.id);
});
document.addEventListener("keydown", e => {
  const open = document.querySelector(".modal.is-open");
  /* Garde le focus clavier à l'intérieur de la fenêtre ouverte */
  if (open && e.key === "Tab") {
    const items = [...open.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select, textarea")]
      .filter(el => el.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.key === "Escape") document.querySelectorAll(".modal.is-open").forEach(m => closeModal(m.id));
});

/* Ajoute un bouton « œil » à chaque champ mot de passe pour afficher / masquer la saisie */
function enhancePasswords(root = document) {
  root.querySelectorAll('input[type="password"]:not([data-pw])').forEach(input => {
    input.dataset.pw = "";
    const wrap = document.createElement("div");
    wrap.className = "password-field";
    input.before(wrap);
    wrap.append(input);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "password-field__toggle";
    if (input.id) btn.setAttribute("aria-controls", input.id);
    const set = shown => {
      input.type = shown ? "text" : "password";
      btn.setAttribute("aria-pressed", shown);
      btn.setAttribute("aria-label", shown ? "Masquer le mot de passe" : "Afficher le mot de passe");
      btn.title = btn.getAttribute("aria-label");
      btn.innerHTML = icon(shown ? "eyeOff" : "eye", 20);
    };
    set(false);
    btn.addEventListener("click", () => {
      set(input.type === "password");
      input.focus();
    });
    wrap.append(btn);
  });
}

/* Remplace <i data-icon="nom"></i> par le SVG correspondant */
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => {
    el.outerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 20);
  });
}

/* Cartes lumineuses ([data-glow] + .glow-card) : un halo suit le curseur sur le
   contour, s'allume à l'approche et s'éteint en s'éloignant ; au survol, la carte
   s'incline en 3D vers le curseur (souris uniquement). À appeler dans init(). */
function setupGlowCards(root = document) {
  const glows = [...root.querySelectorAll("[data-glow]")];
  if (glows.length && window.matchMedia("(hover: hover) and (pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const reach = 160;
    App.onDocument("pointermove", (e) => {
      glows.forEach((glow) => {
        const r = glow.getBoundingClientRect();
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        glow.style.setProperty("--glow-x", `${(e.clientX - r.left).toFixed(0)}px`);
        glow.style.setProperty("--glow-y", `${(e.clientY - r.top).toFixed(0)}px`);
        glow.style.setProperty("--glow-on", near.toFixed(3));
        // Inclinaison 3D : la carte pivote vers le curseur tant qu'il est dessus
        const inside = dx === 0 && dy === 0;
        const px = inside ? (e.clientX - r.left) / r.width - 0.5 : 0;
        const py = inside ? (e.clientY - r.top) / r.height - 0.5 : 0;
        glow.style.setProperty("--tilt-x", `${(-py * 10).toFixed(2)}deg`);
        glow.style.setProperty("--tilt-y", `${(px * 10).toFixed(2)}deg`);
        glow.classList.toggle("is-tilted", inside);
      });
    });
    // Curseur sorti de la fenêtre : les halos s'éteignent
    App.onDocument("mouseout", (e) => {
      if (e.relatedTarget) return;
      glows.forEach((g) => { g.style.setProperty("--glow-on", "0"); g.style.setProperty("--tilt-x", "0deg"); g.style.setProperty("--tilt-y", "0deg"); g.classList.remove("is-tilted"); });
    });
  }
}

