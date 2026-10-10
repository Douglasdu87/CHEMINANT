/* Vue « Espace église » — #/eglise, #/eglise/referents
   Reversements de l'église : 10&nbsp;% du montant hors taxes de chaque inscription
   validée par l'un de ses référents. Visible uniquement par l'église concernée :
   ni le prix, ni le montant HT, ni la part des référents n'apparaissent ici.
   L'église désigne autant de référents qu'elle le souhaite. */
App.view("eglise", {
  layout: "eglise",
  title: "Espace église",
  mainClass: "app-main",
  template: () => {
    const church = CH.church("c1");
    return `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">${CH.escape(church.name)} · ${CH.escape(church.city)}</span>
      <h1>Reversements de l'église</h1>
      <p class="muted mb-0">Chaque inscription validée par l'un de vos référents reverse à votre église 10&nbsp;% de son montant hors taxes.</p>
    </div>

    <section class="earnings">
      <div class="earnings__head">
        <h2 style="font-size:1.6rem;margin:0">Synthèse</h2>
        <span class="earnings__private">${icon("lock", 14)} Visible par votre église uniquement</span>
      </div>
      <div class="kpis kpis--3" id="church-kpis"></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Membre validé</th><th scope="col">Validé par</th><th scope="col">Validé le</th><th scope="col">Formule</th><th scope="col">Part de l'église (10&nbsp;%)</th></tr></thead>
          <tbody id="church-rows"></tbody>
        </table>
      </div>
      <p class="small muted" style="margin-top:12px">Montants calculés après déduction des taxes. Chaque référent perçoit une part distincte, qu'il est seul à consulter dans son propre espace.</p>
    </section>

    <section id="referents" class="earnings">
      <div class="earnings__head">
        <div>
          <h2 style="font-size:1.6rem;margin:0">Référents de l'église</h2>
          <p class="muted small mb-0">Désignez autant de référents que nécessaire. Chacun reçoit une invitation, suit la formation, puis reçoit et valide les candidats de votre église.</p>
        </div>
        <button class="btn btn--primary btn--sm" id="church-add-referent" type="button">${icon("users", 16)} Ajouter un référent</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Référent</th><th scope="col">Rôle</th><th scope="col">Inscriptions validées</th><th scope="col">Statut</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody id="church-referents"></tbody>
        </table>
      </div>
    </section>
  </div>

<!-- Modale : ajouter un référent -->
<div class="modal" id="modal-church-referent" role="dialog" aria-modal="true" aria-labelledby="cref-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="cref-title" style="font-size:1.5rem">Ajouter un référent</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">Le référent recevra une invitation pour créer son espace et suivre la formation. Il pourra ensuite recevoir et valider les candidats de votre église.</p>
    <form id="church-referent-form">
      <div class="field"><label for="cr-name">Nom complet</label><input class="input" id="cr-name" required placeholder="Ex. Pasteure Anne Dubois" autocomplete="off"></div>
      <div class="field"><label for="cr-email">Adresse e-mail</label><input class="input" id="cr-email" type="email" required placeholder="anne.dubois@exemple.fr" autocomplete="off"></div>
      <div class="field"><label for="cr-role">Rôle dans l'église</label>
        <select class="select" id="cr-role"><option>Pasteur / prêtre</option><option>Ancien</option><option>Responsable de pastorale des couples</option><option>Diacre</option><option>Autre responsable</option></select>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">Envoyer l'invitation</button>
      </div>
    </form>
  </div>
</div>`;
  },
  init() {
    const $ = id => document.getElementById(id);
    const church = CH.church("c1");

    function render() {
      const s = Store.read();
      const lines = CH.churchEarnings(church.id, s);
      const refs = CH.referentsOf(church.id, s);

      $("church-kpis").innerHTML = `
        <div class="kpi"><strong>${CH.sumByCurrency(lines)}</strong><span>Total reversé à l'église</span></div>
        <div class="kpi"><strong>${lines.length}</strong><span>Inscription${lines.length > 1 ? "s" : ""} validée${lines.length > 1 ? "s" : ""}</span></div>
        <div class="kpi"><strong>${refs.length}</strong><span>Référent${refs.length > 1 ? "s" : ""} désigné${refs.length > 1 ? "s" : ""}</span></div>`;

      $("church-rows").innerHTML = lines.length ? lines.map(l => `
        <tr>
          <td><div class="cell-person">${CH.avatar(l.name, l.colors, "sm")}<strong>${CH.escape(l.name)}</strong></div></td>
          <td class="small">${CH.escape(l.referent)}</td>
          <td class="small">${CH.formatDate(l.validatedAt)}</td>
          <td><span class="badge">${CH_DATA.plans[l.plan || "single"].name}</span></td>
          <td><strong>${CH.money(l.amount, l.currency)}</strong></td>
        </tr>`).join("") : `<tr><td colspan="5" class="empty">Aucune inscription validée pour le moment.</td></tr>`;

      $("church-referents").innerHTML = refs.map(r => {
        const count = lines.filter(l => l.referentId === r.id).length;
        return `<tr>
          <td><div class="cell-person">${CH.avatar(r.name.replace(/^(Pasteure?|Père|Sœur|Frère|Ancien)\s+/, ""), ["#c7962c", "#7d153b"], "sm")}<div><strong>${CH.escape(r.name)}</strong>${r.email ? `<div class="small muted">${CH.escape(r.email)}</div>` : ""}</div></div></td>
          <td class="small">${CH.escape(r.role)}</td>
          <td class="small">${count}</td>
          <td>${r.trained ? `<span class="badge badge--sage">${icon("check", 13)} Formé</span>` : `<span class="badge badge--amber">Invitation envoyée</span>`}</td>
          <td style="text-align:right">${r.trained ? "" : `<button class="btn btn--ghost btn--sm" type="button" data-resend="${r.id}">Renvoyer l'invitation</button>`}</td>
        </tr>`;
      }).join("");
    }

    $("church-add-referent").addEventListener("click", () => openModal("modal-church-referent"));
    $("church-referents").addEventListener("click", e => {
      if (e.target.closest("[data-resend]")) toast("Invitation renvoyée (démo).");
    });
    $("church-referent-form").addEventListener("submit", e => {
      e.preventDefault();
      const name = CH.clean($("cr-name").value, 80);
      const email = CH.clean($("cr-email").value, 160);
      if (!name) return $("cr-name").focus();
      if (!email || !$("cr-email").checkValidity()) return $("cr-email").focus();
      Api.church.addReferent({ name, email, role: $("cr-role").value }).then(() => {
        e.target.reset();
        closeModal("modal-church-referent");
        toast(`Invitation envoyée à ${name}.`);
        render();
      });
    });

    render();
  }
});
