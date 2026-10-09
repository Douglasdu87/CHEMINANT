/* =========================================================
   Signaler un membre (Messages, Notre cheminement)
   Le signalement part au référent de l'église du membre ET à l'administrateur,
   qui seul décide de la suite. La personne signalée n'est pas informée de l'auteur.
   ========================================================= */

function reportModal() {
  return `
<div class="modal" id="modal-report" role="dialog" aria-modal="true" aria-labelledby="report-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="report-title" style="font-size:1.5rem">Signaler <span id="report-name"></span></h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="small muted">Votre signalement est transmis à votre référent et à l'administrateur de Cheminant, qui décide de la suite : avertissement, suspension temporaire ou, en cas de récidive, désactivation du compte. La personne ne saura pas qui l'a signalée.</p>
    <div class="field"><label for="report-reason">Motif</label><select class="select" id="report-reason">${CH_DATA.chat.reportReasons.map(r => `<option>${r}</option>`).join("")}</select></div>
    <div class="field"><label for="report-msg">Précisions (facultatif)</label><textarea class="textarea" id="report-msg" placeholder="Ce qui s'est passé, depuis quand…"></textarea></div>
    <label class="check"><input type="checkbox" id="report-excerpt" checked><span>Joindre les derniers messages reçus de cette personne (seuls ces extraits seront lus)</span></label>
    <label class="check"><input type="checkbox" id="report-block"><span>Bloquer aussi ce membre</span></label>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Annuler</button>
      <button class="btn btn--primary" id="report-send">Envoyer le signalement</button>
    </div>
  </div>
</div>`;
}

/* getMember() renvoie le profil concerné ; context : "Messagerie" | "Notre cheminement" ; onBlock() facultatif */
function bindReport({ getMember, context, onBlock }) {
  const $ = id => document.getElementById(id);
  document.querySelectorAll("[data-report]").forEach(b => b.addEventListener("click", () => {
    $("report-name").textContent = getMember().firstName;
    $("report-msg").value = "";
    $("report-block").checked = false;
    $("report-block").closest(".check").hidden = !onBlock;
    openModal("modal-report");
  }));
  $("report-send").onclick = () => {
    const p = getMember();
    const excerpt = $("report-excerpt").checked
      ? (Store.read().messages[p.id] || []).filter(m => m.from === "them").slice(-3).map(m => m.text)
      : [];
    CH.submitReport({ reportedId: p.id, reason: $("report-reason").value, details: $("report-msg").value.trim(), context, excerpt });
    closeModal("modal-report");
    toast("Signalement transmis à votre référent et à l'administrateur. Merci.");
    if (onBlock && $("report-block").checked) onBlock();
  };
}

/* Résumé d'un signalement (espaces référent et administrateur) */
function reportSummary(r, state) {
  const who = id => {
    const m = CH.reportMember(id, state);
    const c = m && CH.church(m.churchId);
    return m ? `<strong>${CH.escape(m.firstName)}</strong> <span class="muted">· ${c ? CH.escape(c.name) : ""}</span>` : "—";
  };
  const D = CH_DATA.moderation.decisions;
  const status = r.status === "traite"
    ? `<span class="badge badge--${D[r.decision].badge}">${D[r.decision].label}${r.decision === "suspension" ? ` · ${r.days} jours` : ""}</span>`
    : `<span class="badge badge--gold">${icon("clock", 12)} En attente de décision</span>`;
  const date = new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return `
    <div class="report__head">
      <div><strong class="report__reason">${CH.escape(r.reason)}</strong><span class="small muted"> · ${r.context} · ${date}</span></div>
      ${status}
    </div>
    <dl class="report__people small">
      <div><dt>Membre signalé</dt><dd>${who(r.reportedId)}</dd></div>
      <div><dt>Signalé par</dt><dd>${who(r.reporter)}</dd></div>
    </dl>
    ${r.details ? `<p class="small report__details">« ${CH.escape(r.details)} »</p>` : ""}
    ${r.excerpt?.length ? `<div class="report__excerpt"><span class="small muted">Extraits joints par la personne qui signale</span>${r.excerpt.map(t => `<p class="msg msg--them">${CH.escape(t)}</p>`).join("")}</div>` : ""}`;
}
