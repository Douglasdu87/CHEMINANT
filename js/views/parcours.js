/* Vue « École du mariage » — #/parcours
   Module activé à l'entrée dans le parcours Cheminons (CH.schoolActive).
   Avant activation : écran verrouillé, aucun contenu de cours affiché. */

const SCHOOL_OPEN = `
  <div class="container" style="max-width:960px">
    <div class="page-head">
      <span class="eyebrow">Parcours Cheminons</span>
      <div class="page-head__row">
        <h1>École du mariage</h1>
        <span class="badge badge--primary" id="couple-badge"></span>
      </div>
      <p class="lead" style="margin-top:12px">10 modules progressifs pour bâtir votre foyer sur le roc. Chaque module contient vidéo, audio, texte, PDF, questionnaire et exercice individuel.</p>
      <a class="btn btn--primary" href="#/ecole">${icon("video", 18)} Cours vidéo et audio</a>
    </div>

    <section class="card" style="margin-bottom:24px">
      <div class="flex between">
        <strong>Progression globale</strong>
        <span class="muted small" id="global-label"></span>
      </div>
      <div class="progress" style="margin:12px 0 18px"><div class="progress__bar" id="global-bar"></div></div>
      <div class="pipeline">
        <span class="is-on">Entrée dans le parcours</span><i>→</i>
        <span class="is-on">École du mariage</span><i>→</i>
        <span id="pp-accomp">Accompagnement</span><i>→</i>
        <span id="pp-prep">Préparation au mariage</span><i>→</i>
        <span>Mariage</span>
      </div>
    </section>

    <div class="modules" id="modules"></div>

    <p class="small muted" style="margin-top:28px">Les contenus sont élaborés avec des responsables pastoraux et, pour les sujets spécialisés, des professionnels compétents.</p>
  </div>
`;

/* Écran affiché tant que le module n'est pas activé */
function schoolLocked() {
  const s = Store.read();
  const relationId = Object.keys(s.interests).find(id => ["relation", "couple"].includes(s.interests[id]));
  const steps = [
    ["Mise en relation", "Un intérêt réciproque ouvre votre espace « Notre cheminement ».", Boolean(relationId)],
    ["Trois mois d'échange", relationId ? `Temps d'épreuve : jour ${CH.cheminantStatus(s, relationId).done} sur ${CH.cheminantStatus(s, relationId).total}. Apprendre à vous connaître, prier et en parler avec votre référent.` : "Trois mois d'échange sur Cheminons pour apprendre à vous connaître et éprouver la relation.", Boolean(relationId && CH.cheminantStatus(s, relationId).unlocked)],
    ["Activation par chacun", "Après ces trois mois, chacun active le parcours Cheminons depuis son profil.", false]
  ];
  const cta = relationId
    ? `<a class="btn btn--primary" href="#/cheminement?id=${relationId}">${icon("pray", 18)} Ouvrir « Notre cheminement »</a>`
    : `<a class="btn btn--primary" href="#/recherche">${icon("search", 18)} Découvrir des profils</a>`;

  return `
  <div class="container" style="max-width:760px">
    <div class="page-head">
      <span class="eyebrow">Parcours Cheminons</span>
      <h1>École du mariage</h1>
    </div>
    <section class="card locked">
      <span class="locked__icon">${icon("lock", 26)}</span>
      <h2 class="locked__title">Ce module s'active après trois mois d'échange, quand vous décidez tous les deux d'avancer ensemble</h2>
      <p class="muted">L'École du mariage est réservée aux couples entrés dans le parcours Cheminons. Elle s'ouvrira automatiquement pour vous deux, avec un suivi de votre référent.</p>
      <ol class="locked__steps">
        ${steps.map(([title, desc, done], i) => `
          <li class="${done ? "is-done" : ""}">
            <span class="locked__dot">${done ? icon("check", 14) : i + 1}</span>
            <div><strong>${title}</strong><span>${desc}</span></div>
          </li>`).join("")}
        <li class="is-target">
          <span class="locked__dot">${icon("book", 14)}</span>
          <div><strong>Activation de l'École du mariage</strong><span>10 modules à suivre à deux, à votre rythme.</span></div>
        </li>
      </ol>
      <div class="flex">${cta}</div>
    </section>
  </div>`;
}

App.view("parcours", {
  layout: "app",
  title: "École du mariage",
  mainClass: "app-main",
  template: () => CH.schoolActive(Store.read()) ? SCHOOL_OPEN : schoolLocked(),
  init() {
    const s = Store.read();
    if (!CH.schoolActive(s)) return;

    const partner = CH.profile(s.coupleWith);
    document.getElementById("couple-badge").textContent = `${s.user.firstName} & ${partner.firstName}`;

    const total = CH_DATA.modules.length;
    const doneCount = CH_DATA.modules.filter(m => CH.moduleDone(s, m.id)).length;
    document.getElementById("global-label").textContent = `${doneCount} / ${total} modules terminés`;
    document.getElementById("global-bar").style.width = `${(doneCount / total) * 100}%`;
    if (doneCount === total) {
      document.getElementById("pp-accomp").classList.add("is-on");
      document.getElementById("global-bar").closest(".card").insertAdjacentHTML("beforeend",
        `<a class="btn btn--primary" style="margin-top:18px" href="#/preparation">${icon("hands", 18)} Passer à l'accompagnement</a>`);
    }

    const formatBadges = CH_DATA.lessonFormats.map(f => `<span class="badge">${icon(f.icon, 13)} ${f.label}</span>`).join("");
    let currentSet = false;

    document.getElementById("modules").innerHTML = CH_DATA.modules.map(m => {
      const pct = CH.moduleProgress(s, m.id);
      const done = pct === 100;
      const unlocked = CH.moduleUnlocked(s, m.id);
      let cls = "", status;
      if (done) { cls = "is-done"; status = `<span class="badge badge--sage">${icon("check", 13)} Terminé</span>`; }
      else if (unlocked && !currentSet) { cls = "is-current"; currentSet = true; status = `<span class="badge badge--primary">En cours · ${pct}&nbsp;%</span>`; }
      else if (!unlocked) { cls = "is-locked"; status = `<span class="badge">${icon("lock", 13)} Après le module ${m.id - 1}</span>`; }
      else status = `<span class="badge">${pct}&nbsp;%</span>`;

      const inner = `
        <div class="module-card__num">${done ? icon("check", 24) : m.id}</div>
        <div>
          <div class="module-card__head">
            <h3>Module ${m.id} : ${m.title}</h3>
            ${status}
          </div>
          <p class="module-card__topics">${m.topics.join(" · ")}</p>
          ${m.sensitive ? `<p class="small" style="color:var(--color-primary-dark);margin:-4px 0 10px">${icon("info", 14)} Contenus élaborés avec des responsables pastoraux et des professionnels compétents.</p>` : ""}
          <div class="module-card__formats">${formatBadges}<span class="badge badge--gold">${icon("clock", 13)} ${m.duration}</span></div>
          ${!done && unlocked && pct > 0 ? `<div class="progress" style="margin-top:14px"><div class="progress__bar" style="width:${pct}%"></div></div>` : ""}
        </div>`;
      return unlocked
        ? `<a class="module-card ${cls}" href="#/module?id=${m.id}">${inner}</a>`
        : `<div class="module-card ${cls}" aria-disabled="true">${inner}</div>`;
    }).join("");
  }
});
