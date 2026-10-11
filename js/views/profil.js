/* Vue « Profil » — #/profil */
/* Fiche profil */
App.view("profil", {
  layout: "app",
  title: "Profil",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <a href="#/recherche" class="small" style="text-decoration:none;display:inline-flex;gap:6px;align-items:center"><i data-icon="back" data-size="16"></i> Retour aux profils</a>
    </div>
    <div id="profile"></div>
  </div>

<!-- Modale : demande d'accompagnement -->
<div class="modal" id="modal-accomp" role="dialog" aria-modal="true" aria-labelledby="accomp-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="accomp-title" style="font-size:1.5rem">Demander un accompagnement</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">Vous hésitez ou souhaitez un regard extérieur ? Votre référent peut vous accompagner dans votre discernement, en toute confidentialité.</p>
    <div class="field"><label for="accomp-msg">Votre message (facultatif)</label><textarea class="textarea" id="accomp-msg" placeholder="Ce qui vous questionne, ce que vous aimeriez partager…"></textarea></div>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Annuler</button>
      <button class="btn btn--primary" id="accomp-send">Envoyer à mon référent</button>
    </div>
  </div>
</div>
`,
  init(ctx) {
  const root = document.getElementById("profile");
  const p = CH.profile(CH.param("id")) || (Remote.on ? null : CH_DATA.profiles[0]);
  if (!p) {
    root.innerHTML = `<div class="card card--soft empty">${icon("users", 40)}<p class="mb-0">Ce profil n'est pas disponible.</p></div>`;
    return;
  }
  const church = CH.church(p.churchId) || { name: "", city: "", referent: "" };
  document.title = `${p.firstName} | Cheminant`;

  function actionsHtml(s) {
    const status = s.interests[p.id];
    const accomp = s.accompaniment.includes(p.id);
    const accompBtn = `<button class="btn btn--ghost btn--block" id="btn-accomp" ${accomp ? "disabled" : ""}>${icon("hands", 18)} ${accomp ? "Accompagnement demandé" : "Demander un accompagnement"}</button>`;

    const pipeline = `
      <div class="pipeline" aria-label="Statut de la relation">
        <span class="${status ? "is-on" : ""}">Intérêt</span><i>→</i>
        <span class="${["relation", "couple"].includes(status) ? "is-on" : ""}">Intérêt réciproque</span><i>→</i>
        <span class="${["relation", "couple"].includes(status) ? "is-on" : ""}">Mise en relation</span>
      </div>`;

    if (s.user.status !== "actif") {
      return `<div class="alert alert--amber">${icon("lock")}<p>Vous pourrez manifester votre intérêt après la validation de votre profil.</p></div>`;
    }
    /* Messagerie : membres validés et à jour de leur formule, des deux côtés */
    const canWrite = CH.chatEligible(p) && !s.blocked.includes(p.id);
    const msgBtn = !canWrite ? ""
      : CH.canChat(s) ? `<a class="btn btn--ghost btn--block" href="#/messages?id=${p.id}">${icon("chat", 18)} Envoyer un message</a>`
      : `<a class="btn btn--ghost btn--block" href="#/paiement">${icon("lock", 18)} Régler ma formule pour écrire</a>`;
    if (p.gender === s.user.gender) {
      return `<p class="small muted mb-0">${icon("users", 14)} Membre de la communauté Cheminant</p>${msgBtn.replace("btn--ghost", "btn--primary")}`;
    }
    if (status === "relation" || status === "couple") {
      return `${pipeline}<a class="btn btn--primary btn--block" href="#/cheminement?id=${p.id}">${icon("pray", 18)} Ouvrir « Notre cheminement »</a>${msgBtn}${accompBtn}`;
    }
    if (status === "interet") {
      return `${pipeline}
        <div class="alert alert--gold">${icon("clock")}<p>Votre intérêt a été transmis. Si ${CH.escape(p.firstName)} manifeste également son intérêt, vous serez mis en relation.</p></div>
        ${msgBtn}${accompBtn}`;
    }
    return `${pipeline}
      <button class="btn btn--primary btn--block btn--lg" id="btn-interest">${icon("heart", 18)} Manifester mon intérêt</button>
      ${msgBtn}
      <button class="btn btn--ghost btn--block" id="btn-pass">Passer</button>
      ${accompBtn}`;
  }

  function render() {
    const s = Store.read();
    root.innerHTML = `
      <div class="profile-hero">
        <div class="stack" style="gap:24px">
          <section class="card">
            <div class="profile-id">
              ${CH.avatar(p.firstName, p.colors, "xl")}
              <div>
                <span class="badge badge--sage">${icon("shield", 14)} Validé par ${CH.escape(church.referent)}</span>
                <h1 style="margin:10px 0 4px;font-size:2.4rem">${CH.escape(p.firstName)}, ${p.age} ans</h1>
                <p class="muted mb-0">${icon("map", 16)} ${CH.escape(p.city)} ${p.job ? ` · ${icon("briefcase", 16)} ${CH.escape(p.job)}` : ""}</p>
                <p class="muted mb-0">${icon("church", 16)} ${CH.escape(church.name)} · ${CH.escape(church.denomination)}</p>
              </div>
            </div>
            ${p.quote ? `<div class="prose"><blockquote style="margin:24px 0 0">« ${CH.escape(p.quote)} »</blockquote></div>` : ""}
          </section>

          <section class="card">
            <h2 style="font-size:1.4rem">À propos</h2>
            <p>${CH.escape(p.about)}</p>
            <div class="facts">
              <div class="fact"><small>Foi</small><strong>${CH.escape(p.faith) || "—"}</strong></div>
              <div class="fact"><small>Service</small><strong>${CH.escape(p.service) || "—"}</strong></div>
              <div class="fact"><small>Enfants</small><strong>${CH.escape(p.children) || "—"}</strong></div>
              <div class="fact"><small>Mobilité</small><strong>${CH.escape(p.mobility) || "—"}</strong></div>
              <div class="fact"><small>Langues</small><strong>${CH.escape(p.languages) || "—"}</strong></div>
            </div>
            <h3 style="font-size:1.05rem;margin-top:24px">Centres d'intérêt</h3>
            <div class="profile-card__tags">${p.interests.map(i => `<span class="badge">${CH.escape(i)}</span>`).join("")}</div>
          </section>
        </div>

        <aside class="stack" style="gap:24px">
          <section class="card">
            <h2 style="font-size:1.3rem">5 points de convergence</h2>
            <ul class="conv-list">
              ${p.conv.map(([label, level]) => `<li><span class="flex" style="gap:8px"><span class="dot dot--${level}"></span>${label}</span>${CH.levelBadge(level)}</li>`).join("")}
            </ul>
            <p class="small muted" style="margin:14px 0 0">Ces indications sont établies à partir de vos réponses respectives. Elles ne remplacent ni la rencontre, ni le discernement. <a href="#/transparence">Comment ça marche ?</a></p>
          </section>
          <section class="card action-bar" id="actions">${actionsHtml(s)}</section>
        </aside>
      </div>`;

    const $ = id => document.getElementById(id);
    $("btn-interest")?.addEventListener("click", () => {
      const res = CH.expressInterest(p.id);
      toast(res === "relation" ? `Intérêt réciproque ! Vous êtes mis en relation avec ${p.firstName}.` : "Votre intérêt a été transmis.");
      render();
    });
    $("btn-pass")?.addEventListener("click", () => {
      CH.pass(p.id);
      toast(`Profil de ${p.firstName} passé.`);
      setTimeout(() => (location.href = "#/recherche"), 800);
    });
    $("btn-accomp")?.addEventListener("click", () => openModal("modal-accomp"));
  }

  document.getElementById("accomp-send").addEventListener("click", () => {
    CH.requestAccompaniment(p.id);
    closeModal("modal-accomp");
    toast("Votre demande a été transmise à votre référent.");
    render();
  });

  render();
  }
});
