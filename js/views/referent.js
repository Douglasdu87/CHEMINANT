/* Vue « Espace référent » — #/referent */
/* Espace référent : candidats, entretiens, décisions */
App.view("referent", {
  layout: "referent",
  title: "Espace référent",
  mainClass: "app-main",
  template: () => {
    const me = CH.staff();
    const church = CH.church(me.churchId) || { name: "", city: "" };
    return `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">${CH.escape(church.name)} · ${CH.escape(church.city)}</span>
      <h1>Bonjour ${CH.escape(me.name)}</h1>
      <p class="muted mb-0">Vous accompagnez les membres de votre communauté dans leur démarche sur Cheminons.</p>
    </div>

    <div class="kpis" id="kpis"></div>

    <!-- Candidats -->
    <section style="margin-bottom:48px">
      <div class="flex between" style="margin-bottom:16px">
        <h2 style="font-size:1.6rem;margin:0">Candidats à valider</h2>
        <div class="tabs" role="tablist" style="margin:0;border:0" id="filter-tabs">
          <button class="tab" role="tab" data-f="pending" aria-selected="true">À traiter</button>
          <button class="tab" role="tab" data-f="all" aria-selected="false">Tous</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Candidat</th><th scope="col">Inscription</th><th scope="col">Entretien</th><th scope="col">Décision</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody id="candidates"></tbody>
        </table>
      </div>
    </section>

    <!-- Entretiens -->
    <section id="entretiens" style="margin-bottom:48px">
      <h2 style="font-size:1.6rem">Entretiens planifiés</h2>
      <div class="grid grid--3" id="interviews"></div>
    </section>

    <!-- Couples & accompagnement -->
    <section id="couples" class="grid grid--2">
      <div class="card">
        <h2 style="font-size:1.3rem">École du mariage : couples suivis</h2>
        <p class="small muted">Progression des cours vidéo et audio de chaque conjoint.</p>
        <div class="stack" id="couples-list"></div>
      </div>
      <div class="card">
        <h2 style="font-size:1.3rem">Demandes d'accompagnement</h2>
        <div class="stack" id="accomp-list"></div>
      </div>
    </section>

    <!-- Signalements : le référent est informé et donne son avis ; l'administrateur décide -->
    <section id="signalements" style="margin-top:48px">
      <div class="earnings__head">
        <div>
          <h2 style="font-size:1.6rem;margin:0">Signalements</h2>
          <p class="muted small mb-0">Signalements concernant un membre de votre église. Ils sont aussi transmis à l'administrateur de Cheminons, qui décide de la suite. Votre avis l'éclaire.</p>
        </div>
      </div>
      <div class="stack" id="reports-ref"></div>
    </section>

    <!-- Reversements : visibles uniquement par ce référent -->
    <section id="reversements" class="earnings">
      <div class="earnings__head">
        <div>
          <h2 style="font-size:1.6rem;margin:0">Mes reversements</h2>
          <p class="muted small mb-0">10&nbsp;% du montant hors taxes de chaque inscription que vous avez validée.</p>
        </div>
        <span class="earnings__private">${icon("lock", 14)} Visible par vous seul</span>
      </div>
      <div class="kpis kpis--2" id="earn-kpis"></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Candidat validé</th><th scope="col">Validé le</th><th scope="col">Formule</th><th scope="col">Votre part (10&nbsp;%)</th></tr></thead>
          <tbody id="earn-rows"></tbody>
        </table>
      </div>
      <p class="small muted" style="margin-top:12px">Seules les inscriptions que vous avez vous-même validées apparaissent ici. Votre église perçoit une part distincte, consultable uniquement dans son propre espace.</p>
    </section>
  </div>

<!-- Modale : planifier -->
<div class="modal" id="modal-plan" role="dialog" aria-modal="true" aria-labelledby="plan-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="plan-title" style="font-size:1.5rem">Planifier l'entretien</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted" id="plan-who"></p>
    <form id="plan-form">
      <div class="field"><label for="plan-date">Date et heure</label><input class="input" type="datetime-local" id="plan-date" required></div>
      <div class="field"><label for="plan-place">Lieu</label><select class="select" id="plan-place"><option>Bureau pastoral de l'église</option><option>Visioconférence</option><option>Autre lieu (à préciser au candidat)</option></select></div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">Planifier et prévenir le candidat</button>
      </div>
    </form>
  </div>
</div>

<!-- Modale : décision -->
<div class="modal" id="modal-decision" role="dialog" aria-modal="true" aria-labelledby="dec-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="dec-title" style="font-size:1.5rem">Décision après entretien</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted" id="dec-who"></p>
    <form id="dec-form">
      <fieldset class="field">
        <legend>Votre décision</legend>
        <div class="decision-grid">
          <label class="decision-opt"><input type="radio" name="decision" value="valider" required><span>Valider</span></label>
          <label class="decision-opt"><input type="radio" name="decision" value="demander_infos"><span>Demander des informations</span></label>
          <label class="decision-opt"><input type="radio" name="decision" value="mettre_en_attente"><span>Mettre en attente</span></label>
          <label class="decision-opt"><input type="radio" name="decision" value="refuser"><span>Refuser</span></label>
        </div>
      </fieldset>
      <div id="dec-sensitive" hidden>
        <div class="alert alert--amber" style="margin-bottom:16px">
          <i data-icon="lock"></i>
          <p>Le motif reste <strong>strictement interne</strong> et n'est jamais affiché au candidat. Celui-ci reçoit un message neutre l'invitant à échanger avec vous.</p>
        </div>
        <div class="field"><label for="dec-reason">Note interne (facultatif, visible des seuls référents)</label><textarea class="textarea" id="dec-reason" placeholder="Évitez toute information sensible non nécessaire."></textarea></div>
      </div>
      <div class="field"><label for="dec-msg">Message au candidat</label><textarea class="textarea" id="dec-msg"></textarea></div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary">Enregistrer la décision</button>
      </div>
    </form>
  </div>
</div>
`;
  },
  init(ctx) {
  const $ = id => document.getElementById(id);
  const churchId = CH.staff().churchId;
  let filter = "pending";
  let active = null; // candidat en cours d'édition

  const messages = {
    valider: "Bonne nouvelle : votre profil est validé ! Vous pouvez désormais découvrir des profils sur Cheminons. Je reste disponible pour vous accompagner.",
    demander_infos: "Merci pour notre échange. J'aimerais compléter votre demande avec quelques informations : je reprendrai contact avec vous prochainement.",
    mettre_en_attente: "Votre demande est momentanément en attente. N'hésitez pas à venir m'en parler, je reste à votre écoute.",
    refuser: "Votre demande n'a pas pu aboutir pour le moment. Je vous propose que nous en parlions de vive voix, en toute confidentialité."
  };

  function candidates() {
    const s = Store.read();
    return CH_DATA.candidates.map(c => Object.assign({}, c, s.candidates[c.id]));
  }

  function save(id, patch) {
    Store.update(s => {
      s.candidates[id] = Object.assign({}, s.candidates[id], patch);
      /* Le candidat k1 est l'utilisateur de la démo : sa validation active son profil */
      if (id === s.user.candidateId && "decision" in patch) {
        s.user.status = patch.decision === "valider" ? "actif" : "en_attente_validation";
      }
    });
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function interviewSteps(status) {
    const idx = CH_DATA.interviewSteps.findIndex(x => x.key === status);
    return `<div class="interview-steps">${CH_DATA.interviewSteps.map((st, i) =>
      `<span class="${i <= idx ? "is-on" : ""}">${st.label}</span>${i < 2 ? "<i aria-hidden='true'>›</i>" : ""}`).join("")}</div>`;
  }

  function actionFor(c) {
    if (c.interview === "a_planifier") return `<button class="btn btn--primary btn--sm" data-act="plan" data-id="${c.id}">${icon("calendar", 15)} Planifier</button>`;
    if (c.interview === "planifie") return `<button class="btn btn--ghost btn--sm" data-act="done" data-id="${c.id}">${icon("check", 15)} Entretien réalisé</button>`;
    return `<button class="btn ${c.decision ? "btn--ghost" : "btn--primary"} btn--sm" data-act="decide" data-id="${c.id}">${c.decision ? "Modifier" : "Décider"}</button>`;
  }

  function render() {
    const list = candidates();
    const s = Store.read();

    /* KPIs */
    const pending = list.filter(c => c.decision !== "valider" && c.decision !== "refuser");
    $("kpis").innerHTML = `
      <div class="kpi"><strong>${list.filter(c => c.interview === "a_planifier").length}</strong><span>Entretiens à planifier</span></div>
      <div class="kpi"><strong>${list.filter(c => c.interview === "planifie").length}</strong><span>Entretiens planifiés</span></div>
      <div class="kpi"><strong>${list.filter(c => c.decision === "valider").length}</strong><span>Membres validés</span></div>
      <div class="kpi"><strong>${CH.schoolCouples(s, churchId).length}</strong><span>Couples en cheminement</span></div>`;

    /* Tableau */
    const rows = filter === "pending" ? pending : list;
    $("candidates").innerHTML = rows.length ? rows.map(c => {
      const dec = c.decision ? CH_DATA.decisions[c.decision] : null;
      return `<tr>
        <td><div class="cell-person">${CH.avatar(c.name, c.colors, "sm", c.photo)}<div><strong>${CH.escape(c.name)}</strong><br><span class="small muted">${c.age} ans · ${CH.escape(c.city)}</span></div></div></td>
        <td class="small">${c.since}</td>
        <td>${interviewSteps(c.interview)}${c.date && c.interview === "planifie" ? `<div class="small muted" style="margin-top:4px">${fmtDate(c.date)}</div>` : ""}</td>
        <td>${dec ? `<span class="badge badge--${dec.badge}">${dec.label}</span>` : `<span class="small muted">—</span>`}</td>
        <td style="text-align:right">${actionFor(c)}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="5" class="empty">Aucun candidat en attente. Merci pour votre accompagnement !</td></tr>`;

    /* Entretiens planifiés */
    const planned = list.filter(c => c.interview === "planifie");
    $("interviews").innerHTML = planned.length ? planned.map(c => `
      <article class="card">
        <div class="flex">${CH.avatar(c.name, c.colors, "sm", c.photo)}<strong>${CH.escape(c.name)}</strong></div>
        <p class="small" style="margin:14px 0 4px">${icon("calendar", 15)} ${c.date ? fmtDate(c.date) : "Date à confirmer"}</p>
        <p class="small muted">${icon("map", 15)} ${CH.escape(c.place || "Bureau pastoral de l'église")}</p>
        <button class="btn btn--ghost btn--sm" data-act="done" data-id="${c.id}">Marquer comme réalisé</button>
      </article>`).join("") : `<p class="muted">Aucun entretien planifié.</p>`;

    /* Couples suivis */
    $("couples-list").innerHTML = CH.schoolCouples(s, churchId).map(c => coupleProgress(c)).join("");

    /* Demandes d'accompagnement (mode supabase : membres de l'église du référent) */
    if (Remote.on) {
      const people = Remote.data.people || {};
      const reqs = (Remote.data.accompaniment || []).filter(a => people[a.member]);
      $("accomp-list").innerHTML = reqs.length ? reqs.map(a => {
        const m = people[a.member], about = a.about && people[a.about];
        return `<div class="row-card" style="padding:14px">
          ${CH.avatar(m.firstName, m.colors, "sm", m.photo)}
          <div class="row-card__body"><strong>${CH.escape(m.firstName)}</strong><div class="small muted">${about ? `Souhaite un regard sur sa relation avec ${CH.escape(about.firstName)}` : "Souhaite échanger avec vous"} · ${CH.formatDate(a.date.slice(0, 10))}</div></div>
        </div>`;
      }).join("") : `<p class="muted small">Aucune demande pour le moment. Les membres peuvent vous solliciter depuis un profil ou leur espace « Notre cheminement ».</p>`;
    }
    const acc = Remote.on ? [] : s.accompaniment.map(id => CH.profile(id)).filter(Boolean);
    if (!Remote.on) $("accomp-list").innerHTML = acc.length ? acc.map(p => `
      <div class="row-card" style="padding:14px">
        ${CH.avatar(s.user.firstName + " " + s.user.lastName, s.user.colors, "sm", s.user.photo)}
        <div class="row-card__body"><strong>${CH.escape(s.user.firstName)} ${CH.escape(s.user.lastName)}</strong><div class="small muted">Souhaite un regard sur sa relation avec ${CH.escape(p.firstName)}</div></div>
        <button class="btn btn--ghost btn--sm" data-act="contact">Proposer un échange</button>
      </div>`).join("") : `<p class="muted small">Aucune demande pour le moment. Les membres peuvent vous solliciter depuis un profil ou leur espace « Notre cheminement ».</p>`;

    document.querySelectorAll("#filter-tabs .tab").forEach(t => t.setAttribute("aria-selected", t.dataset.f === filter));
    renderReports();

    /* Reversements du référent connecté : ses validations et sa part uniquement */
    const lines = CH.referentEarnings(CH_DATA.demoReferentId, s);
    $("earn-kpis").innerHTML = `
      <div class="kpi"><strong>${CH.sumByCurrency(lines)}</strong><span>Total de vos reversements</span></div>
      <div class="kpi"><strong>${lines.length}</strong><span>Inscription${lines.length > 1 ? "s" : ""} validée${lines.length > 1 ? "s" : ""} par vous</span></div>`;
    $("earn-rows").innerHTML = lines.length ? lines.map(l => `
      <tr>
        <td><div class="cell-person">${CH.avatar(l.name, l.colors, "sm", l.photo)}<strong>${CH.escape(l.name)}</strong></div></td>
        <td class="small">${CH.formatDate(l.validatedAt)}</td>
        <td><span class="badge">${CH_DATA.plans[l.plan || "single"].name}</span></td>
        <td><strong>${CH.money(l.amount, l.currency)}</strong></td>
      </tr>`).join("") : `<tr><td colspan="4" class="empty">Aucune inscription validée par vous pour le moment.</td></tr>`;
  }

  /* Actions */
  App.onDocument("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const c = candidates().find(x => x.id === b.dataset.id);
    active = c;
    switch (b.dataset.act) {
      case "plan":
        $("plan-who").textContent = `Entretien de validation avec ${c.name}.`;
        openModal("modal-plan");
        break;
      case "done":
        save(c.id, { interview: "realise" });
        Remote.push(() => Api.referent.interviewDone(c.id));
        toast(`Entretien avec ${c.name} marqué comme réalisé.`);
        render();
        break;
      case "decide":
        $("dec-who").textContent = `${c.name} · entretien réalisé`;
        $("dec-form").reset();
        $("dec-msg").value = "";
        $("dec-sensitive").hidden = true;
        if (c.decision) {
          $("dec-form").querySelector(`input[value="${c.decision}"]`).checked = true;
          $("dec-msg").value = messages[c.decision];
          $("dec-sensitive").hidden = c.decision !== "refuser";
        }
        openModal("modal-decision");
        break;
      case "contact":
        toast(Remote.on ? "Pensez à contacter ce membre pour lui proposer un échange." : "Proposition d'échange envoyée (démo).");
        break;
    }
  });

  /* Signalements de l'église (référent : avis consultatif) */
  function renderReports() {
    const s = Store.read();
    const list = CH.reportsForChurch(s, churchId);
    $("reports-ref").innerHTML = list.length ? list.map(r => `
      <article class="card report">
        ${reportSummary(r, s)}
        ${r.status === "traite"
          ? (r.referentNote ? `<p class="small muted mb-0">Votre avis : « ${CH.escape(r.referentNote)} »</p>` : "")
          : r.referentNote
            ? `<p class="alert alert--sage small mb-0">${icon("check")}<span>Avis transmis à l'administrateur : « ${CH.escape(r.referentNote)} »</span></p>`
            : `<div class="field mb-0"><label for="note-${r.id}">Votre avis pour l'administrateur (facultatif)</label>
                 <textarea class="textarea" id="note-${r.id}" placeholder="Ce que vous savez de la situation, votre recommandation…"></textarea></div>
               <div><button class="btn btn--ghost btn--sm" data-note="${r.id}">Transmettre mon avis</button></div>`}
      </article>`).join("")
      : `<div class="card card--soft empty">${icon("shield", 40)}<p class="mb-0">Aucun signalement ne concerne votre église.</p></div>`;
  }
  $("reports-ref").addEventListener("click", e => {
    const b = e.target.closest("[data-note]");
    if (!b) return;
    const note = $("note-" + b.dataset.note).value.trim();
    if (!note) return $("note-" + b.dataset.note).focus();
    Store.update(s => { s.reports.find(r => r.id === b.dataset.note).referentNote = note; });
    Remote.push(() => Api.referent.noteReport(b.dataset.note, note));
    toast("Votre avis a été transmis à l'administrateur.");
    renderReports();
  });

  $("filter-tabs").addEventListener("click", e => {
    const t = e.target.closest(".tab");
    if (t) { filter = t.dataset.f; render(); }
  });

  $("plan-form").addEventListener("submit", e => {
    e.preventDefault();
    const when = $("plan-date").value, place = CH.clean($("plan-place").value, 160);
    save(active.id, { interview: "planifie", date: when, place });
    /* L'heure saisie est locale : envoyée au serveur en ISO (UTC) */
    const target = active.id;
    Remote.push(() => Api.referent.planInterview(target, { date: new Date(when).toISOString(), place }));
    closeModal("modal-plan");
    toast(`Entretien planifié. ${active.name.split(" ")[0]} a été prévenu(e).`);
    render();
  });

  $("dec-form").addEventListener("change", e => {
    if (e.target.name !== "decision") return;
    $("dec-msg").value = messages[e.target.value];
    $("dec-sensitive").hidden = e.target.value !== "refuser";
  });

  $("dec-form").addEventListener("submit", e => {
    e.preventDefault();
    const decision = new FormData(e.target).get("decision");
    const today = new Date().toISOString().slice(0, 10);
    const target = active.id, note = $("dec-reason").value.trim(), message = $("dec-msg").value.trim();
    Remote.push(() => Api.referent.decide(target, decision, decision === "refuser" ? note : "", message));
    save(active.id, {
      decision,
      validatedAt: decision === "valider" ? (active.validatedAt || today) : null,
      validatedBy: decision === "valider" ? (active.validatedBy || CH_DATA.demoReferentId) : null
    });
    closeModal("modal-decision");
    toast(`Décision enregistrée : ${CH_DATA.decisions[decision].label}. Message transmis.`);
    render();
  });

  render();
  }
});
