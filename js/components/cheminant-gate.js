/* =========================================================
   Temps d'épreuve : 3 mois d'échange avant le parcours Cheminant
   Bloc réutilisé dans « Mon profil », « Notre cheminement » et le tableau de bord.
   ========================================================= */

function cheminantGate(p, st) {
  const date = d => CH.formatDate(d.toISOString().slice(0, 10), { day: "numeric", month: "long", year: "numeric" });
  const who = (label, ok) => `<li><span>${label}</span>${ok
    ? `<span class="badge badge--sage">${icon("check", 12)} Activé</span>`
    : `<span class="badge">Pas encore</span>`}</li>`;
  return `
    <div class="trial">
      <div class="flex between">
        <strong>${st.unlocked ? "Trois mois d'échange accomplis" : "Temps d'épreuve : trois mois d'échange"}</strong>
        <span class="badge ${st.unlocked ? "badge--sage" : "badge--gold"}">Jour ${st.done} / ${st.total}</span>
      </div>
      <div class="progress trial__bar" role="progressbar" aria-label="Temps d'échange écoulé" aria-valuemin="0" aria-valuemax="${st.total}" aria-valuenow="${st.done}">
        <div class="progress__bar" style="width:${st.pct}%"></div>
      </div>
      <p class="small muted mb-0">Mise en relation le ${date(st.start)} · ${st.messages} message${st.messages > 1 ? "s" : ""} échangé${st.messages > 1 ? "s" : ""}.
        ${st.unlocked
          ? `Le parcours Cheminant peut être activé depuis le ${date(st.unlock)}.`
          : `Le parcours Cheminant pourra être activé le <strong>${date(st.unlock)}</strong>, dans ${st.left} jour${st.left > 1 ? "s" : ""}.`}</p>
      ${st.unlocked ? `<ul class="trial__consents">${who("Vous", st.me)}${who(CH.escape(p.firstName), st.them)}</ul>` : ""}
    </div>`;
}

/* Carte de suivi d'un couple à l'École du mariage (espace référent) */
function coupleProgress(c) {
  const last = c.lastDays == null ? "aucune activité" : c.lastDays === 0 ? "actif aujourd'hui" : `dernière activité il y a ${c.lastDays} j`;
  return `
    <div class="row-card couple-row">
      <div class="couple-banner__avatars">${CH.avatar(c.partners[0], c.colors[0], "sm")}${CH.avatar(c.partners[1], c.colors[1], "sm")}</div>
      <div class="row-card__body">
        <div class="flex between"><strong>${CH.escape(c.names)}</strong><span class="badge ${c.assiduity.badge ? "badge--" + c.assiduity.badge : ""}">${c.assiduity.label}</span></div>
        <div class="small muted">Depuis ${c.since} · module ${c.module} : ${CH.module(c.module).title} · ${last}</div>
        <div class="couple-row__bars">${c.partners.map((n, i) => `
          <div><div class="flex between small"><span>${CH.escape(n)}</span><span class="muted">${c.progress[i]}&nbsp;%</span></div>
          <div class="progress"><div class="progress__bar" style="width:${c.progress[i]}%"></div></div></div>`).join("")}</div>
      </div>
    </div>`;
}
