/* Vue « Intérêts » — #/interets */
/* Intérêts reçus / envoyés / mises en relation */
App.view("interets", {
  layout: "app",
  title: "Intérêts",
  mainClass: "app-main",
  template: () => `
  <div class="container" style="max-width:900px">
    <div class="page-head">
      <span class="eyebrow">Double intérêt</span>
      <h1>Vos intérêts</h1>
      <div class="pipeline" style="margin-top:14px">
        <span class="is-on">Intérêt</span><i>→</i><span class="is-on">Intérêt réciproque</span><i>→</i><span class="is-on">Mise en relation</span>
      </div>
      <p class="muted" style="margin-top:12px">Un intérêt partagé ouvre votre espace « Notre cheminement » et le début de vos trois mois d'échange.</p>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab" role="tab" data-tab="recus" aria-selected="true">Reçus<span class="count" id="c-recus">0</span></button>
      <button class="tab" role="tab" data-tab="envoyes" aria-selected="false">Envoyés<span class="count" id="c-envoyes">0</span></button>
      <button class="tab" role="tab" data-tab="relations" aria-selected="false">Mises en relation<span class="count" id="c-relations">0</span></button>
    </div>
    <div class="stack" id="list" role="tabpanel"></div>
  </div>
`,
  init(ctx) {
  const list = document.getElementById("list");
  let tab = ["recus", "envoyes", "relations"].includes(CH.param("tab")) ? CH.param("tab") : "recus";

  function groups(s) {
    const visible = CH.visibleProfiles(s);
    return {
      recus: visible.filter(p => p.receivedInterest && !s.interests[p.id]),
      envoyes: visible.filter(p => s.interests[p.id] === "interet"),
      relations: CH_DATA.profiles.filter(p => ["relation", "couple"].includes(s.interests[p.id]))
    };
  }

  function row(p, kind) {
    const church = CH.church(p.churchId);
    let actions = "", badge = "";
    if (kind === "recus") {
      badge = `<span class="badge badge--primary">${icon("heart", 14)} ${CH.escape(p.firstName)} a manifesté son intérêt</span>`;
      actions = `<a class="btn btn--ghost btn--sm" href="#/profil?id=${p.id}">Consulter</a>
                 <button class="btn btn--ghost btn--sm" data-action="pass" data-id="${p.id}">Passer</button>
                 <button class="btn btn--primary btn--sm" data-action="interest" data-id="${p.id}">Intérêt en retour</button>`;
    } else if (kind === "envoyes") {
      badge = `<span class="badge badge--gold">${icon("clock", 14)} En attente de réponse</span>`;
      actions = `<a class="btn btn--ghost btn--sm" href="#/profil?id=${p.id}">Consulter</a>`;
    } else {
      const couple = Store.read().interests[p.id] === "couple";
      badge = couple ? `<span class="badge badge--primary">Couple en cheminement</span>` : `<span class="badge badge--sage">${icon("check", 14)} Mise en relation</span>`;
      actions = `<a class="btn btn--primary btn--sm" href="#/cheminement?id=${p.id}">${icon("pray", 16)} Notre cheminement</a>`;
    }
    return `
      <article class="row-card">
        ${CH.avatar(p.firstName, p.colors)}
        <div class="row-card__body">
          <strong>${CH.escape(p.firstName)}, ${p.age} ans</strong>
          <div class="small muted">${CH.escape(p.city)} · ${CH.escape(church.name)}</div>
          <div style="margin-top:6px">${badge}</div>
        </div>
        <div class="row-card__actions">${actions}</div>
      </article>`;
  }

  const empty = {
    recus: "Aucun intérêt reçu pour le moment. Patience : chaque chose en son temps.",
    envoyes: "Vous n'avez pas d'intérêt en attente.",
    relations: "Aucune mise en relation pour l'instant."
  };

  function render() {
    const s = Store.read();
    if (s.user.status !== "actif") {
      list.innerHTML = `<div class="card card--soft empty">${icon("lock", 40)}<p class="mb-0">Disponible après validation de votre profil par votre référent.</p></div>`;
      return;
    }
    const g = groups(s);
    Object.keys(g).forEach(k => (document.getElementById("c-" + k).textContent = g[k].length));
    document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.tab === tab));
    list.innerHTML = g[tab].length ? g[tab].map(p => row(p, tab)).join("") : `<div class="empty">${icon("heart", 40)}<p>${empty[tab]}</p></div>`;
  }

  document.querySelector(".tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab");
    if (t) { tab = t.dataset.tab; render(); }
  });

  list.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const p = CH.profile(btn.dataset.id);
    if (btn.dataset.action === "interest") {
      CH.expressInterest(p.id);
      toast(`Intérêt réciproque avec ${p.firstName} ! Vous êtes mis en relation.`);
      tab = "relations";
    } else {
      CH.pass(p.id);
      toast(`Profil de ${p.firstName} passé.`);
    }
    render();
  });

  render();
  }
});
