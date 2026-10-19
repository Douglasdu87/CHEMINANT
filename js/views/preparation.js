/* Vue « Vers le mariage » — #/preparation */
/* Vers le mariage : accompagnement, préparation, mariage */
App.view("preparation", {
  layout: "app",
  title: "Vers le mariage",
  mainClass: "app-main",
  template: () => `
  <div class="container" style="max-width:960px">
    <div class="page-head">
      <span class="eyebrow">Parcours Cheminant · étapes 13 à 15</span>
      <h1>Vers le mariage</h1>
      <p class="lead" style="margin-top:12px">Après l'École du mariage, votre couple est accompagné jusqu'au jour de l'alliance.</p>
    </div>
    <div id="prep"></div>
  </div>
`,
  init(ctx) {
  const root = document.getElementById("prep");

  function stageHead(num, title, state, subtitle) {
    const badge = {
      done: `<span class="badge badge--sage">${icon("check", 13)} Terminé</span>`,
      current: `<span class="badge badge--primary">En cours</span>`,
      locked: `<span class="badge">${icon("lock", 13)} À venir</span>`
    }[state];
    return `
      <div class="stage-head">
        <span class="stage-head__num stage-head__num--${state}">${state === "done" ? icon("check", 22) : num}</span>
        <div style="flex:1;min-width:200px"><h2 style="font-size:1.5rem;margin:0">${title}</h2><p class="small muted mb-0">${subtitle}</p></div>
        ${badge}
      </div>`;
  }

  function render() {
    const s = Store.read();
    const partner = s.coupleWith && CH.profile(s.coupleWith);

    if (!partner) {
      root.innerHTML = `
        <div class="card card--soft empty">
          ${icon("ring", 44)}
          <h2 style="font-size:1.5rem">Cette étape s'ouvre aux couples en cheminement</h2>
          <p>Lorsque vous aurez décidé d'avancer ensemble et terminé l'École du mariage, vous serez accompagnés ici jusqu'au mariage.</p>
          <a class="btn btn--primary" href="#/cheminement">Notre cheminement</a>
        </div>`;
      return;
    }

    const school = CH.schoolDone(s);
    const accomp = CH.accompanimentDone(s);
    const prepDone = CH.preparationDone(s);
    const church = CH.church(s.user.churchId);
    const stateOf = (done, open) => (done ? "done" : open ? "current" : "locked");

    /* --- 13. Accompagnement --- */
    const nextSession = CH_DATA.sessions.findIndex((_, i) => !s.prep.sessions.includes(i));
    const sessions = CH_DATA.sessions.map((se, i) => {
      const done = s.prep.sessions.includes(i);
      const isNext = school && i === nextSession;
      return `
        <li class="row-card ${!done && !isNext ? "row-card--muted" : ""}">
          <span class="journey__dot" style="${done ? "background:var(--color-sage);border-color:var(--color-sage);color:var(--color-white)" : isNext ? "background:var(--color-primary);border-color:var(--color-primary);color:var(--color-white)" : ""}">${done ? icon("check", 14) : i + 1}</span>
          <div class="row-card__body">
            <strong>${se.title}</strong>
            <div class="small muted">${se.with === "Votre référent" ? CH.escape(church.referent) : se.with} · ${se.duration}</div>
            <p class="small mb-0" style="margin-top:4px">${se.desc}</p>
          </div>
          <div class="row-card__actions">
            ${done ? `<span class="badge badge--sage">Réalisée</span>`
              : isNext ? `<button class="btn btn--ghost btn--sm" data-act="slot">${icon("calendar", 15)} Proposer un créneau</button>
                          <button class="btn btn--primary btn--sm" data-act="session" data-i="${i}">Séance réalisée</button>`
              : ""}
          </div>
        </li>`;
    }).join("");

    /* --- 14. Préparation --- */
    let k = 0;
    const groups = CH_DATA.prepTasks.map(g => `
      <div class="card card--flat">
        <h3 style="font-size:1.1rem">${g.title}</h3>
        <ul class="checklist">${g.items.map(item => {
          const id = k++;
          return `<li><label><input type="checkbox" data-task="${id}" ${s.prep.tasks.includes(id) ? "checked" : ""} ${accomp ? "" : "disabled"}><span>${item}</span></label></li>`;
        }).join("")}</ul>
      </div>`).join("");
    const totalTasks = k;
    const taskPct = Math.round((s.prep.tasks.length / totalTasks) * 100);

    /* --- 15. Mariage --- */
    let wedding;
    if (s.prep.married) {
      wedding = `
        <div class="cta-band">
          <span class="card__icon card__icon--gold" style="width:64px;height:64px;margin:0 auto 16px">${icon("ring", 30)}</span>
          <h2>Félicitations ${CH.escape(s.user.firstName)} & ${CH.escape(partner.firstName)} !</h2>
          <p>« Ce que Dieu a uni, que l'homme ne le sépare pas. » (Marc 10.9)<br>Toute l'équipe Cheminant et vos églises se réjouissent avec vous.</p>
          <button class="btn btn--light" data-act="share">Partager notre témoignage</button>
        </div>`;
    } else if (prepDone) {
      const days = s.prep.weddingDate ? Math.ceil((new Date(s.prep.weddingDate) - new Date()) / 864e5) : null;
      wedding = `
        <div class="card" style="text-align:center">
          <p class="eyebrow">Le grand jour</p>
          <h3 style="font-size:2rem">${s.prep.weddingDate ? new Date(s.prep.weddingDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date à fixer"}</h3>
          ${days !== null && days > 0 ? `<p class="lead">Plus que <strong>${days}</strong> jour${days > 1 ? "s" : ""}</p>` : ""}
          <p class="muted">${CH.escape(church.name)}</p>
          <button class="btn btn--primary" data-act="married">${icon("ring", 18)} Nous nous sommes mariés</button>
        </div>`;
    } else {
      wedding = `<p class="muted mb-0">Cette étape s'ouvrira lorsque la préparation sera terminée.</p>`;
    }

    root.innerHTML = `
      <section class="card" style="margin-bottom:24px">
        <div class="pipeline">
          <span class="${school ? "is-on" : ""}">École du mariage</span><i>→</i>
          <span class="${accomp ? "is-on" : ""}">Accompagnement</span><i>→</i>
          <span class="${prepDone ? "is-on" : ""}">Préparation au mariage</span><i>→</i>
          <span class="${s.prep.married ? "is-on" : ""}">Mariage</span>
        </div>
        ${school ? "" : `<div class="alert alert--gold" style="margin-top:16px">${icon("info")}<p>L'accompagnement commencera lorsque vous aurez terminé les 10 modules de l'<a href="#/parcours">École du mariage</a>.</p></div>`}
      </section>

      <section class="stage">
        ${stageHead(13, "Accompagnement", stateOf(accomp, school), `${s.prep.sessions.length} / ${CH_DATA.sessions.length} séances avec votre référent et un couple accompagnateur`)}
        <ol class="stack" style="list-style:none;padding:0;margin:0">${sessions}</ol>
      </section>

      <section class="stage">
        ${stageHead(14, "Préparation au mariage", stateOf(prepDone, accomp), "Projet matrimonial, démarches et préparation de la cérémonie")}
        <div class="progress" style="margin-bottom:18px"><div class="progress__bar" style="width:${taskPct}%"></div></div>
        <div class="field" style="max-width:320px">
          <label for="wedding-date">Date envisagée du mariage</label>
          <input class="input" type="date" id="wedding-date" value="${s.prep.weddingDate}" ${accomp ? "" : "disabled"}>
        </div>
        <div class="grid grid--3">${groups}</div>
      </section>

      <section class="stage">
        ${stageHead(15, "Mariage", s.prep.married ? "done" : prepDone ? "current" : "locked", "L'alliance devant Dieu, entourés de vos communautés")}
        ${wedding}
      </section>`;
  }

  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "slot") return toast("Vos disponibilités ont été transmises (démo).");
    if (act === "share") return toast("Merci ! Votre témoignage sera relu avant publication (démo).");
    if (act === "session") {
      Store.update(s => { s.prep.sessions.push(Number(b.dataset.i)); });
      Remote.push(() => Api.prep.session(Number(b.dataset.i)));
      toast("Séance d'accompagnement enregistrée.");
    }
    if (act === "married") {
      Store.update(s => { s.prep.married = true; });
      Remote.push(() => Api.prep.wedding({ married: true }));
      toast("Que Dieu bénisse votre foyer !");
    }
    render();
  });

  root.addEventListener("change", e => {
    if (e.target.dataset.task !== undefined) {
      const id = Number(e.target.dataset.task);
      Store.update(s => {
        const set = new Set(s.prep.tasks);
        e.target.checked ? set.add(id) : set.delete(id);
        s.prep.tasks = [...set];
      });
      Remote.push(() => Api.prep.task(id, e.target.checked));
      render();
    }
    if (e.target.id === "wedding-date") {
      Store.update(s => { s.prep.weddingDate = e.target.value; });
      Remote.push(() => Api.prep.wedding({ weddingDate: e.target.value }));
      render();
    }
  });

  render();
  }
});
