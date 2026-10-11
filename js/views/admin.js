/* Vue « Administration » — #/admin */
/* Administration : demandes d'adhésion, églises, référents */
App.view("admin", {
  layout: "admin",
  title: "Administration",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Administration Cheminant</span>
      <h1>Réseau des églises</h1>
      <p class="muted mb-0">Gérez les églises partenaires et leurs référents. L'administration n'a accès ni aux conversations des membres (hors extraits joints à un signalement) ni aux motifs de décision des référents.</p>
    </div>

    <div class="kpis" id="kpis"></div>

    <!-- Aperçu financier -->
    <a class="card fin-teaser" href="#/finances" id="fin-teaser"></a>

    <!-- Signalements : l'administrateur seul décide de la suite -->
    <section id="signalements" style="margin-bottom:48px">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">Signalements</h2>
        <div class="tabs" role="tablist" style="margin:0;border:0" id="rep-tabs">
          <button class="tab" role="tab" data-f="open" aria-selected="true">À traiter</button>
          <button class="tab" role="tab" data-f="done" aria-selected="false">Traités</button>
        </div>
      </div>
      <div class="alert" style="margin-bottom:16px"><i data-icon="shield"></i><p>Chaque signalement est aussi transmis au référent de l'église du membre qui signale. Selon l'objet du signalement, vous pouvez donner un <strong>avertissement</strong> ou <strong>suspendre le compte</strong> (2 jours minimum). En cas de <strong>récidive</strong>, le compte est <strong>désactivé</strong>.</p></div>
      <div class="stack" id="reports"></div>
    </section>

    <!-- École du mariage : assiduité de tous les couples -->
    <section id="ecole" style="margin-bottom:48px">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">École du mariage</h2>
        <span class="small muted">Progression des cours vidéo et audio, par conjoint</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Couple</th><th scope="col">Église</th><th scope="col">Progression</th><th scope="col">Module en cours</th><th scope="col">Dernière activité</th><th scope="col">Assiduité</th></tr></thead>
          <tbody id="school-rows"></tbody>
        </table>
      </div>
    </section>

    <!-- Demandes d'adhésion -->
    <section id="demandes" style="margin-bottom:48px">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">Demandes d'adhésion</h2>
        <div class="tabs" role="tablist" style="margin:0;border:0" id="req-tabs">
          <button class="tab" role="tab" data-f="open" aria-selected="true">À traiter</button>
          <button class="tab" role="tab" data-f="all" aria-selected="false">Toutes</button>
        </div>
      </div>
      <div class="stack" id="requests"></div>
    </section>

    <!-- Églises -->
    <section id="eglises" style="margin-bottom:48px">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">Églises partenaires</h2>
        <div style="min-width:240px;flex:0 1 320px">
          <label for="church-filter" class="sr-only">Rechercher une église</label>
          <input class="input" type="search" id="church-filter" placeholder="Rechercher une église, une ville…">
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Église</th><th scope="col">Sensibilité</th><th scope="col">Référents</th><th scope="col">Membres validés</th><th scope="col">Statut</th></tr></thead>
          <tbody id="churches"></tbody>
        </table>
      </div>
    </section>

    <!-- Référents -->
    <section id="referents">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">Référents</h2>
        <button class="btn btn--primary btn--sm" id="add-referent"><i data-icon="users" data-size="16"></i> Ajouter un référent</button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Référent</th><th scope="col">Église</th><th scope="col">Rôle</th><th scope="col">Formation</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody id="referents-list"></tbody>
        </table>
      </div>
    </section>
  </div>

<!-- Modale : décision sur un signalement -->
<div class="modal" id="modal-sanction" role="dialog" aria-modal="true" aria-labelledby="sanction-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="sanction-title" style="font-size:1.5rem">Décision</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <div id="sanction-context"></div>
    <form id="sanction-form">
      <fieldset class="field">
        <legend>Suite donnée au signalement</legend>
        <div class="decision-grid">
          <label class="decision-opt"><input type="radio" name="sanction" value="avertissement" required><span>Avertissement</span></label>
          <label class="decision-opt"><input type="radio" name="sanction" value="suspension"><span>Suspension temporaire</span></label>
          <label class="decision-opt"><input type="radio" name="sanction" value="desactivation"><span>Désactiver le compte</span></label>
          <label class="decision-opt"><input type="radio" name="sanction" value="classe"><span>Classer sans suite</span></label>
        </div>
      </fieldset>
      <div class="field" id="sanction-days-field" hidden>
        <label for="sanction-days">Durée de la suspension</label>
        <select class="select" id="sanction-days">${CH_DATA.moderation.suspensionDays.map(d => `<option value="${d}">${d} jours</option>`).join("")}</select>
        <span class="hint">Selon l'objet du signalement, ${CH_DATA.moderation.minSuspensionDays} jours minimum.</span>
      </div>
      <div class="field"><label for="sanction-note">Note interne (facultatif)</label><textarea class="textarea" id="sanction-note" placeholder="Éléments retenus pour la décision"></textarea></div>
      <p class="small muted">Le membre concerné reçoit un message neutre l'informant de la décision, sans jamais connaître l'auteur du signalement. La personne qui a signalé est informée que son signalement a été traité.</p>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">Appliquer la décision</button>
      </div>
    </form>
  </div>
</div>

<!-- Modale : demander des précisions à une église candidate -->
<div class="modal" id="modal-precisions" role="dialog" aria-modal="true" aria-labelledby="prec-title">
  <div class="modal__box modal__box--wide">
    <div class="modal__head">
      <h2 id="prec-title" style="font-size:1.5rem">Demander des précisions</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted" id="prec-who"></p>
    <form id="prec-form">
      <fieldset class="field">
        <legend>Questions à poser</legend>
        <div class="prec-list">${CH_DATA.partnerQuestions.map((q, i) => `
          <label class="check"><input type="checkbox" name="q" value="${i}"><span>${q}</span></label>`).join("")}</div>
      </fieldset>
      <div class="field">
        <label for="prec-other">Autre question (facultatif)</label>
        <input class="input" id="prec-other" placeholder="Ex. Votre église dispose-t-elle d'une salle pour les entretiens ?">
      </div>
      <div class="field">
        <label for="prec-msg">Message d'accompagnement</label>
        <textarea class="textarea" id="prec-msg"></textarea>
      </div>
      <p class="small muted" id="prec-error" role="alert" hidden style="color:var(--color-danger)">Choisissez au moins une question ou rédigez la vôtre.</p>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">${icon("send", 16)} Envoyer la demande</button>
      </div>
    </form>
  </div>
</div>

<!-- Modale : activer un partenariat -->
<div class="modal" id="modal-accept" role="dialog" aria-modal="true" aria-labelledby="accept-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="accept-title" style="font-size:1.5rem">Activer le partenariat</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted" id="accept-who"></p>
    <form id="accept-form">
      <div class="field"><label for="accept-region">Tarifs appliqués aux membres de cette église</label>
        <select class="select" id="accept-region">${CH_DATA.pricing.map(r => `<option value="${r.region}">${r.label} (${r.currency === "XOF" ? "FCFA" : "euros"})</option>`).join("")}</select>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary" id="accept-confirm">Activer et inviter le responsable</button>
      </div>
    </form>
  </div>
</div>

<!-- Modale : ajouter un référent -->
<div class="modal" id="modal-referent" role="dialog" aria-modal="true" aria-labelledby="ref-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="ref-title" style="font-size:1.5rem">Ajouter un référent</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">Le référent doit être désigné par la direction de son église. Il recevra une invitation pour créer son espace et suivre la formation.</p>
    <form id="referent-form">
      <div class="field"><label for="rf-name">Nom complet</label><input class="input" id="rf-name" required placeholder="Ex. Pasteure Anne Dubois"></div>
      <div class="field"><label for="rf-email">Adresse e-mail</label><input class="input" id="rf-email" type="email" required placeholder="anne.dubois@exemple.fr" autocomplete="off"></div>
      <div class="field"><label for="rf-church">Église</label><select class="select" id="rf-church" required></select></div>
      <div class="field"><label for="rf-role">Rôle dans l'église</label>
        <select class="select" id="rf-role"><option>Pasteur / prêtre</option><option>Ancien</option><option>Responsable de pastorale des couples</option><option>Diacre</option><option>Autre responsable</option></select>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">Envoyer l'invitation</button>
      </div>
    </form>
  </div>
</div>
`,
  init(ctx) {
  const $ = id => document.getElementById(id);
  let reqFilter = "open";
  let repFilter = "open";
  let current = null; // signalement en cours de décision

  const REQ_STATUS = {
    nouvelle: ["gold", "Nouvelle"],
    precisions: ["sky", "Précisions demandées"],
    acceptee: ["sage", "Partenaire activé"],
    declinee: ["danger", "Déclinée"]
  };

  /* Membres validés par église (démo : nombre fictif et stable) */
  const membersOf = c => Remote.on ? (Remote.data.membersByChurch || {})[c.id] || 0 : c.extra ? 0 : 12 + (c.name.length * 7) % 40;

  const referents = s => CH.allReferents(s);

  function render() {
    const s = Store.read();
    const churches = CH.allChurches(s);
    const refs = referents(s);
    const open = s.partnerRequests.filter(r => r.status === "nouvelle" || r.status === "precisions");

    $("kpis").innerHTML = `
      <div class="kpi"><strong>${churches.length}</strong><span>Églises partenaires</span></div>
      <div class="kpi"><strong>${refs.length}</strong><span>Référents</span></div>
      <div class="kpi"><strong>${open.length}</strong><span>Demandes à traiter</span></div>
      <div class="kpi"><strong>${churches.reduce((n, c) => n + membersOf(c), 0)}</strong><span>Membres validés</span></div>`;

    /* Aperçu des flux financiers (détail sur #/finances) */
    const ledger = CH.ledger(s);
    const bySum = key => CH.sumByCurrency(ledger.map(l => ({ amount: l[key], currency: l.currency })));
    $("fin-teaser").innerHTML = `
      <span class="fin-teaser__icon">${icon("briefcase", 22)}</span>
      <span class="fin-teaser__body">
        <strong>Flux financiers</strong>
        <span class="small muted">${ledger.length} inscriptions validées. Encaissé : ${bySum("gross")}. Part Cheminant : ${bySum("toPlatform")}.</span>
      </span>
      <span class="link-arrow">Voir le détail ${icon("arrow", 16)}</span>`;

    renderReports(s);

    /* École du mariage */
    $("school-rows").innerHTML = CH.schoolCouples(s).map(c => `<tr>
      <td><div class="cell-person"><div class="couple-banner__avatars">${CH.avatar(c.partners[0], c.colors[0], "sm")}${CH.avatar(c.partners[1], c.colors[1], "sm")}</div><strong>${CH.escape(c.names)}</strong></div></td>
      <td class="small">${CH.escape(CH.church(c.churchId).name)}</td>
      <td style="min-width:200px">${c.partners.map((n, i) => `<div class="flex between small"><span>${CH.escape(n)}</span><span class="muted">${c.progress[i]}&nbsp;%</span></div><div class="progress" style="margin-bottom:6px"><div class="progress__bar" style="width:${c.progress[i]}%"></div></div>`).join("")}</td>
      <td class="small">${c.module}. ${CH.module(c.module).title}</td>
      <td class="small nowrap">${c.lastDays == null ? "Aucune" : c.lastDays === 0 ? "Aujourd'hui" : `Il y a ${c.lastDays} j`}</td>
      <td><span class="badge ${c.assiduity.badge ? "badge--" + c.assiduity.badge : ""}">${c.assiduity.label}</span></td>
    </tr>`).join("");

    /* Demandes */
    const reqs = reqFilter === "open" ? open : s.partnerRequests;
    $("requests").innerHTML = reqs.length ? reqs.map(r => {
      const [cls, label] = REQ_STATUS[r.status];
      const actions = r.status === "nouvelle" || r.status === "precisions"
        ? `<button class="btn btn--ghost btn--sm" data-req="declinee" data-id="${r.id}">Décliner</button>
           <button class="btn btn--ghost btn--sm" data-req="precisions" data-id="${r.id}">${r.status === "precisions" ? "Relancer ou compléter" : "Demander des précisions"}</button>
           <button class="btn btn--primary btn--sm" data-req="acceptee" data-id="${r.id}">${icon("check", 15)} Activer le partenariat</button>`
        : "";
      return `
        <article class="row-card">
          <span class="card__icon card__icon--gold" style="margin:0">${icon("church")}</span>
          <div class="row-card__body">
            <strong>${CH.escape(r.church)}</strong> <span class="badge badge--${cls}">${label}</span>
            <div class="small muted">${CH.escape(r.city)} · ${CH.escape(r.denomination)} · ${CH.escape(r.members)} membres · reçue le ${r.date}</div>
            <div class="small" style="margin-top:4px">Responsable : <strong>${CH.escape(r.contact)}</strong>${r.email ? ` (${CH.escape(r.email)}${r.phone ? `, ${CH.escape(r.phone)}` : ""})` : ""} · Référent pressenti : <strong>${CH.escape(r.referent)}</strong></div>
            ${r.note ? `<p class="small muted mb-0" style="margin-top:4px">« ${CH.escape(r.note)} »</p>` : ""}
            ${r.questions?.length ? `
            <details class="prec-sent">
              <summary class="small">Précisions demandées le ${r.askedAt} (${r.questions.length} question${r.questions.length > 1 ? "s" : ""}) · en attente de réponse</summary>
              <ol class="small">${r.questions.map(q => `<li>${CH.escape(q)}</li>`).join("")}</ol>
              ${r.message ? `<p class="small muted mb-0">« ${CH.escape(r.message)} »</p>` : ""}
            </details>` : ""}
          </div>
          <div class="row-card__actions">${actions}</div>
        </article>`;
    }).join("") : `<div class="card card--soft empty">${icon("church", 40)}<p class="mb-0">Aucune demande à traiter.</p></div>`;

    /* Églises */
    const term = $("church-filter").value.trim().toLowerCase();
    const list = churches.filter(c => !term || `${c.name} ${c.city} ${c.denomination}`.toLowerCase().includes(term));
    $("churches").innerHTML = list.length ? list.map(c => {
      const n = refs.filter(r => r.churchId === c.id).length;
      return `<tr>
        <td><strong>${CH.escape(c.name)}</strong><br><span class="small muted">${CH.escape(c.city)}</span></td>
        <td>${CH.escape(c.denomination)}</td>
        <td>${n} référent${n > 1 ? "s" : ""}</td>
        <td>${membersOf(c)}</td>
        <td>${c.extra ? `<span class="badge badge--gold">Nouvelle · formation en cours</span>` : `<span class="badge badge--sage">Active</span>`}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="5" class="empty">Aucune église ne correspond.</td></tr>`;

    /* Référents */
    $("referents-list").innerHTML = refs.map((r, i) => {
      const c = CH.allChurches(s).find(x => x.id === r.churchId);
      return `<tr>
        <td><div class="cell-person">${CH.avatar(r.name.replace(/^(Pasteure?|Père|Sœur|Frère|Ancien)\s+/, ""), ["#c7962c", "#7d153b"], "sm")}<strong>${CH.escape(r.name)}</strong></div></td>
        <td class="small">${c ? CH.escape(c.name) : "—"}</td>
        <td class="small">${CH.escape(r.role)}</td>
        <td>${r.trained ? `<span class="badge badge--sage">${icon("check", 13)} Formé</span>` : `<span class="badge badge--amber">Invitation envoyée</span>`}</td>
        <td style="text-align:right">${r.trained ? "" : `<button class="btn btn--ghost btn--sm" data-resend="${i}">Renvoyer l'invitation</button>`}</td>
      </tr>`;
    }).join("");

    $("rf-church").innerHTML = churches.map(c => `<option value="${c.id}">${CH.escape(c.name)}, ${CH.escape(c.city)}</option>`).join("");
    document.querySelectorAll("#req-tabs .tab").forEach(t => t.setAttribute("aria-selected", t.dataset.f === reqFilter));
  }

  /* ---------- Signalements ---------- */
  function history(id, s) {
    const D = CH_DATA.moderation.decisions;
    const list = s.sanctions[id] || [];
    const acc = CH.accountStatus(id, s);
    return `
      <div class="report__history small">
        <span class="badge ${acc.active ? "badge--sage" : "badge--danger"}">${acc.label}</span>
        ${CH.isRecidivist(id, s) ? `<span class="badge badge--danger">${icon("info", 12)} Récidive : sanction déjà prononcée</span>` : `<span class="muted">Aucune sanction antérieure</span>`}
        ${list.length ? `<ul>${list.map(x => `<li>${D[x.type].label}${x.until ? ` jusqu'au ${CH.formatDate(x.until.slice(0, 10))}${x.lifted ? " (levée)" : ""}` : ""} · ${CH.formatDate(x.date.slice(0, 10))}</li>`).join("")}</ul>` : ""}
      </div>`;
  }

  function renderReports(s) {
    const list = s.reports.filter(r => repFilter === "open" ? r.status !== "traite" : r.status === "traite");
    $("reports").innerHTML = list.length ? list.map(r => {
      const acc = CH.accountStatus(r.reportedId, s);
      return `
      <article class="card report">
        ${reportSummary(r, s)}
        <div class="report__ref small">${icon("church", 16)}<span>${r.referentNote
          ? `Avis du référent : « ${CH.escape(r.referentNote)} »`
          : `<span class="muted">Le référent n'a pas encore donné son avis.</span>`}</span></div>
        ${history(r.reportedId, s)}
        ${r.status === "traite" && r.adminNote ? `<p class="small muted mb-0">Note de décision : « ${CH.escape(r.adminNote)} »</p>` : ""}
        <div class="row-card__actions">
          ${r.status !== "traite" ? `<button class="btn btn--primary btn--sm" data-decide="${r.id}">${icon("shield", 15)} Prendre une décision</button>` : ""}
          ${acc.type === "suspension" && r.decision === "suspension" ? `<button class="btn btn--ghost btn--sm" data-lift="${r.reportedId}">Lever la suspension</button>` : ""}
        </div>
      </article>`;
    }).join("") : `<div class="card card--soft empty">${icon("shield", 40)}<p class="mb-0">${repFilter === "open" ? "Aucun signalement à traiter." : "Aucun signalement traité pour le moment."}</p></div>`;
    document.querySelectorAll("#rep-tabs .tab").forEach(t => t.setAttribute("aria-selected", t.dataset.f === repFilter));
  }

  $("rep-tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab");
    if (t) { repFilter = t.dataset.f; render(); }
  });
  $("reports").addEventListener("click", e => {
    const lift = e.target.closest("[data-lift]");
    if (lift) { CH.liftSuspension(lift.dataset.lift); toast("Suspension levée. Le compte est de nouveau actif."); return render(); }
    const b = e.target.closest("[data-decide]");
    if (!b) return;
    const s = Store.read();
    current = s.reports.find(r => r.id === b.dataset.decide);
    const m = CH.reportMember(current.reportedId, s);
    const recid = CH.isRecidivist(current.reportedId, s);
    $("sanction-title").textContent = `Décision concernant ${m.firstName}`;
    $("sanction-context").innerHTML = recid
      ? `<div class="alert alert--amber" style="margin-bottom:16px">${icon("info")}<p><strong>Récidive.</strong> Une sanction a déjà été prononcée contre ce membre : la règle prévoit la désactivation du compte.</p></div>`
      : `<p class="small muted">Motif signalé : <strong>${CH.escape(current.reason)}</strong>. Premier signalement sanctionnable : la désactivation n'est possible qu'en cas de récidive.</p>`;
    $("sanction-form").reset();
    const desac = document.querySelector('input[name="sanction"][value="desactivation"]');
    desac.disabled = !recid;
    desac.closest(".decision-opt").title = recid ? "" : "Réservée à la récidive";
    if (recid) desac.checked = true;
    $("sanction-days-field").hidden = true;
    openModal("modal-sanction");
  });
  $("sanction-form").addEventListener("change", e => {
    if (e.target.name === "sanction") $("sanction-days-field").hidden = e.target.value !== "suspension";
  });
  $("sanction-form").addEventListener("submit", e => {
    e.preventDefault();
    const decision = new FormData(e.target).get("sanction");
    const m = CH.reportMember(current.reportedId);
    CH.decideReport(current.id, decision, { days: $("sanction-days").value, note: $("sanction-note").value.trim() });
    closeModal("modal-sanction");
    toast({
      avertissement: `Avertissement envoyé à ${m.firstName}.`,
      suspension: `Compte de ${m.firstName} suspendu ${Math.max(CH_DATA.moderation.minSuspensionDays, Number($("sanction-days").value))} jours.`,
      desactivation: `Compte de ${m.firstName} désactivé.`,
      classe: "Signalement classé sans suite."
    }[decision]);
    render();
  });

  /* Traitement d'une demande */
  $("requests").addEventListener("click", e => {
    const b = e.target.closest("[data-req]");
    if (!b) return;
    const status = b.dataset.req;
    if (status === "precisions") return openPrecisions(b.dataset.id);
    if (Remote.on) return reviewRemote(b.dataset.id, status);
    let name = "";
    Store.update(s => {
      const r = s.partnerRequests.find(x => x.id === b.dataset.id);
      r.status = status;
      name = r.church;
      if (status === "acceptee") {
        const id = "x" + r.id;
        s.extraChurches.push({ id, name: r.church, city: r.city, denomination: r.denomination, referent: r.referent, extra: true });
        s.extraReferents.push({ id: `xr-${Date.now()}`, name: r.referent, churchId: id, role: "Référent désigné", trained: false });
      }
    });
    toast({
      acceptee: `${name} est désormais partenaire. Une invitation a été envoyée au référent.`,
      precisions: `Demande de précisions envoyée à ${name}.`,
      declinee: `La demande de ${name} a été déclinée. Un message courtois a été envoyé.`
    }[status]);
    render();
  });

  /* Mode supabase : l'activation crée l'église et invite son responsable par e-mail */
  let acceptId = null;
  function reviewRemote(id, status) {
    const r = Store.read().partnerRequests.find(x => x.id === id);
    if (status === "acceptee") {
      acceptId = id;
      $("accept-who").innerHTML = `<strong>${CH.escape(r.church)}</strong> (${CH.escape(r.city)}) rejoindra le réseau. ${r.email
        ? `<strong>${CH.escape(r.contact)}</strong> recevra à <strong>${CH.escape(r.email)}</strong> une invitation pour ouvrir l'espace de l'église et désigner ses référents.`
        : "Aucune adresse e-mail n'a été fournie : vous pourrez ajouter ses référents depuis la liste des référents."}`;
      return openModal("modal-accept");
    }
    Api.admin.reviewChurchRequest(id, status)
      .then(() => Remote.refresh())
      .then(() => { toast(`La demande de ${r.church} a été déclinée.`); render(); })
      .catch(err => toast(err.message));
  }
  $("accept-form").addEventListener("submit", e => {
    e.preventDefault();
    const btn = $("accept-confirm");
    const r = Store.read().partnerRequests.find(x => x.id === acceptId);
    btn.disabled = true;
    Api.admin.reviewChurchRequest(acceptId, "acceptee", $("accept-region").value)
      .then(() => Remote.refresh())
      .then(() => {
        closeModal("modal-accept");
        toast(`${r.church} est désormais partenaire.${r.email ? " Une invitation a été envoyée à son responsable." : ""}`);
        render();
      })
      .catch(err => toast(err.message))
      .finally(() => { btn.disabled = false; });
  });

  /* Demande de précisions : questions explicites envoyées au responsable de l'église */
  let precId = null;
  function openPrecisions(id) {
    const r = Store.read().partnerRequests.find(x => x.id === id);
    precId = id;
    $("prec-form").reset();
    $("prec-error").hidden = true;
    $("prec-who").innerHTML = `Ces questions seront envoyées à <strong>${CH.escape(r.contact)}</strong>, responsable de <strong>${CH.escape(r.church)}</strong>. La demande reste en attente jusqu'à sa réponse.`;
    const asked = r.questions || [];
    document.querySelectorAll('#prec-form input[name="q"]').forEach(c => { c.checked = asked.includes(CH_DATA.partnerQuestions[c.value]); });
    if (!asked.length) [0, 1].forEach(i => { document.querySelector(`#prec-form input[name="q"][value="${i}"]`).checked = true; });
    $("prec-msg").value = r.message || `Bonjour ${r.contact},\n\nMerci pour la demande de partenariat de ${r.church}. Avant de l'activer, nous aimerions mieux vous connaître. Pourriez-vous répondre aux questions ci-dessous ?\n\nFraternellement,\nL'équipe Cheminant`;
    openModal("modal-precisions");
  }
  $("prec-form").addEventListener("submit", e => {
    e.preventDefault();
    const questions = [...document.querySelectorAll('#prec-form input[name="q"]:checked')].map(c => CH_DATA.partnerQuestions[c.value]);
    const other = $("prec-other").value.trim();
    if (other) questions.push(other);
    if (!questions.length) { $("prec-error").hidden = false; return; }
    let name = "";
    const target = precId, message = $("prec-msg").value.trim();
    Remote.push(() => Api.admin.askChurchRequest(target, questions, message));
    Store.update(s => {
      const r = s.partnerRequests.find(x => x.id === precId);
      Object.assign(r, { status: "precisions", questions, message: $("prec-msg").value.trim(), askedAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) });
      name = r.contact;
    });
    closeModal("modal-precisions");
    toast(`${questions.length} question${questions.length > 1 ? "s" : ""} envoyée${questions.length > 1 ? "s" : ""} à ${name}.`);
    render();
  });

  $("req-tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab");
    if (t) { reqFilter = t.dataset.f; render(); }
  });
  $("church-filter").addEventListener("input", render);

  $("referents-list").addEventListener("click", e => {
    const b = e.target.closest("[data-resend]");
    if (!b) return;
    if (!Remote.on) return toast("Invitation renvoyée (démo).");
    const ref = referents(Store.read())[Number(b.dataset.resend)];
    Api.admin.resendInvite(ref.id).then(() => toast(`Invitation renvoyée à ${ref.name}.`)).catch(err => toast(err.message));
  });

  $("add-referent").addEventListener("click", () => openModal("modal-referent"));
  $("referent-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = CH.clean($("rf-name").value, 80);
    const email = CH.clean($("rf-email").value, 160);
    if (!name) return $("rf-name").focus();
    if (!email || !$("rf-email").checkValidity()) return $("rf-email").focus();
    const finish = () => {
      e.target.reset();
      closeModal("modal-referent");
      toast(`Invitation envoyée à ${name}.`);
      render();
    };
    if (Remote.on) {
      const btn = e.target.querySelector(".btn--primary");
      btn.disabled = true;
      Api.admin.addReferent({ name, email, churchId: $("rf-church").value, role: $("rf-role").value })
        .then(() => Remote.refresh()).then(finish)
        .catch(err => toast(err.message))
        .finally(() => { btn.disabled = false; });
      return;
    }
    Store.update(s => { s.extraReferents.push({ id: `xr-${Date.now()}`, name, email, churchId: $("rf-church").value, role: $("rf-role").value, trained: false }); });
    finish();
  });

  render();
  }
});
