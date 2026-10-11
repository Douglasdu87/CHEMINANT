/* Carte de profil partagée (tableau de bord + recherche) */

function relationBadge(status) {
  const map = {
    interet: ["gold", "Intérêt envoyé"],
    relation: ["sage", "Mis en relation"],
    couple: ["primary", "Couple en cheminement"]
  };
  if (!map[status]) return "";
  const [cls, label] = map[status];
  return `<span class="badge badge--${cls}">${label}</span>`;
}

function renderProfileCard(p, state) {
  const church = CH.church(p.churchId);
  const status = state.interests[p.id];
  const top3 = p.conv.slice(0, 3).map(([label, level]) =>
    `<div><span class="dot dot--${level}"></span>${label} : <span class="muted">${CH_DATA.levels[level].label.toLowerCase()}</span></div>`).join("");

  const actions = status
    ? `<a class="btn btn--ghost btn--sm" href="#/profil?id=${p.id}">Voir le profil</a>`
    : `<button class="btn btn--ghost btn--sm" data-action="pass" data-id="${p.id}" aria-label="Passer le profil de ${CH.escape(p.firstName)}">Passer</button>
       <button class="btn btn--primary btn--sm" data-action="interest" data-id="${p.id}">${icon("heart", 16)} Intérêt</button>`;

  return `
    <article class="profile-card">
      <div class="profile-card__top">
        <span class="profile-card__verified badge badge--sage" title="Validé par ${CH.escape(church.referent)}">${icon("shield", 14)} Validé</span>
        ${CH.avatar(p.firstName, p.colors, "lg")}
        <h3 class="profile-card__name"><a href="#/profil?id=${p.id}" style="color:inherit;text-decoration:none">${CH.escape(p.firstName)}, ${p.age} ans</a></h3>
        <div class="profile-card__meta">${CH.escape(p.city)}${p.job ? ` · ${CH.escape(p.job)}` : ""}</div>
        <div class="profile-card__meta small">${icon("church", 14)} ${CH.escape(church.name)}</div>
      </div>
      <div class="profile-card__body">
        ${p.quote ? `<p class="profile-card__quote">« ${CH.escape(p.quote)} »</p>` : ""}
        <div class="conv-mini">${top3}</div>
        ${status ? `<div>${relationBadge(status)}</div>` : ""}
        <div class="profile-card__actions">${actions}</div>
      </div>
    </article>`;
}

/* Délégation des clics Intérêt / Passer */
function bindProfileActions(container, rerender) {
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const p = CH.profile(id);
    if (btn.dataset.action === "interest") {
      const res = CH.expressInterest(id);
      toast(res === "relation"
        ? `Intérêt réciproque avec ${p.firstName} ! Vous êtes mis en relation.`
        : `Votre intérêt a été transmis à ${p.firstName}.`);
    } else if (btn.dataset.action === "pass") {
      CH.pass(id);
      toast(`Profil de ${p.firstName} passé.`);
    }
    rerender();
  });
}
