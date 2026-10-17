/* Vue « Tableau de bord » — #/tableau-de-bord */
/* Tableau de bord membre */
App.view("tableau-de-bord", {
  layout: "app",
  title: "Tableau de bord",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow" id="greeting-eyebrow">Mon espace</span>
      <h1 id="greeting">Bonjour</h1>
    </div>

    <div class="dash-grid">
      <div class="stack" style="gap:24px">
        <!-- Statut -->
        <section class="card status-card" id="status-card" aria-live="polite"></section>

        <!-- Suggestions -->
        <section id="suggestions-block">
          <div class="flex between" style="margin-bottom:16px">
            <h2 style="font-size:1.6rem;margin:0">Suggestions de la semaine</h2>
            <a href="#/recherche" class="btn btn--ghost btn--sm">Tout découvrir</a>
          </div>
          <div class="alert" style="margin-bottom:20px">
            <i data-icon="compass"></i>
            <p>Nous avons identifié des personnes avec lesquelles plusieurs éléments de votre projet de vie semblent converger. Ces suggestions sont indicatives : vous restez libre de vos choix. <a href="#/transparence">Comment sont-elles établies ?</a></p>
          </div>
          <div class="grid grid--cards" id="suggestions"></div>
        </section>
      </div>

      <!-- Parcours global -->
      <aside class="stack" style="gap:24px">
        <section class="card school-teaser" id="school-card" hidden></section>
        <section class="card chat-teaser" id="chat-card" hidden></section>
        <section class="card">
          <h2 style="font-size:1.3rem">Mon parcours</h2>
          <div class="flex between small muted" style="margin-bottom:6px"><span>Progression</span><span id="journey-pct"></span></div>
          <div class="progress" style="margin-bottom:24px"><div class="progress__bar" id="journey-bar"></div></div>
          <ol class="journey" id="journey"></ol>
        </section>
      </aside>
    </div>
  </div>
`,
  init(ctx) {
  function render() {
    const s = Store.read();
    const church = CH.church(s.user.churchId);
    const idx = CH.journeyIndex(s);
    const pending = s.user.status !== "actif";

    document.getElementById("greeting").textContent = `Bonjour ${s.user.firstName}`;

    /* Carte de statut selon l'étape */
    const statusCard = document.getElementById("status-card");
    const relationId = Object.keys(s.interests).find(id => ["relation", "couple"].includes(s.interests[id]));
    const relation = relationId && CH.profile(relationId);
    let html;
    if (pending) {
      const cand = Object.assign({}, CH_DATA.candidates.find(c => c.id === s.user.candidateId), s.candidates[s.user.candidateId]);
      const decision = cand.decision;
      let msg = `Votre demande a été transmise à <strong>${CH.escape(church.referent)}</strong> (${CH.escape(church.name)}). Il vous contactera pour un entretien de validation.`;
      if (cand.interview === "planifie") msg = `Votre entretien de validation avec <strong>${CH.escape(church.referent)}</strong> est planifié. Vous recevrez un rappel la veille.`;
      if (decision === "demander_infos") msg = `Votre référent souhaite échanger avec vous pour compléter votre demande. Il prendra contact avec vous prochainement.`;
      if (decision === "mettre_en_attente") msg = `Votre demande est momentanément en attente. Votre référent reste disponible pour en parler avec vous.`;
      if (decision === "refuser") msg = `Votre demande n'a pas pu aboutir pour le moment. Nous vous invitons à en parler directement avec votre référent, en toute confidentialité.`;
      html = `
        <span class="card__icon card__icon--gold" style="width:64px;height:64px;margin:0">${icon("clock", 28)}</span>
        <div class="status-card__body">
          <span class="badge badge--amber">En attente de validation</span>
          <h2 style="font-size:1.4rem;margin:10px 0 6px">Validation par votre référent</h2>
          <p class="muted mb-0">${msg}</p>
        </div>`;
    } else if (s.coupleWith) {
      const p = CH.profile(s.coupleWith);
      html = `
        <div class="couple-banner__avatars">${CH.avatar(s.user.firstName, s.user.colors, "", s.user.photo)}${CH.avatar(p.firstName, p.colors, "", p.photo)}</div>
        <div class="status-card__body">
          <span class="badge badge--primary">Couple en cheminement</span>
          <h2 style="font-size:1.4rem;margin:10px 0 6px">${CH.escape(s.user.firstName)} & ${CH.escape(p.firstName)}</h2>
          <p class="muted mb-0">${CH.schoolDone(s) ? "École du mariage terminée : vous êtes accompagnés jusqu'au mariage." : "Vous êtes entrés dans le parcours Cheminant. Poursuivez l'École du mariage à votre rythme."}</p>
        </div>
        ${CH.schoolDone(s)
          ? `<a class="btn btn--primary" href="#/preparation">Vers le mariage</a>`
          : `<a class="btn btn--primary" href="#/ecole">${icon("book", 18)} École du mariage</a>`}`;
    } else if (relation) {
      html = `
        ${CH.avatar(relation.firstName, relation.colors, "lg", relation.photo)}
        <div class="status-card__body">
          <span class="badge badge--sage">Mise en relation</span>
          <h2 style="font-size:1.4rem;margin:10px 0 6px">Temps de discernement avec ${CH.escape(relation.firstName)}</h2>
          ${cheminantGate(relation, CH.cheminantStatus(s, relation.id))}
        </div>
        <a class="btn btn--primary" href="#/cheminement?id=${relation.id}">Notre cheminement</a>`;
    } else {
      html = `
        <span class="card__icon card__icon--sage" style="width:64px;height:64px;margin:0">${icon("shield", 28)}</span>
        <div class="status-card__body">
          <span class="badge badge--sage">Profil activé</span>
          <h2 style="font-size:1.4rem;margin:10px 0 6px">Validé par ${CH.escape(church.referent)}</h2>
          <p class="muted mb-0">Votre profil est visible par les membres validés. Découvrez les profils et vos suggestions.</p>
        </div>
        <a class="btn btn--primary" href="#/recherche">Découvrir des profils</a>`;
    }
    statusCard.innerHTML = html;
    document.getElementById("paused-note")?.remove();
    document.getElementById("photo-note")?.remove();
    if (!s.user.photo) statusCard.insertAdjacentHTML("beforebegin",
      `<div class="alert alert--amber" id="photo-note">${icon("camera")}<p><strong>Votre photo de profil est exigée.</strong> Un profil avec photo est mieux recommandé aux autres membres. Vous pouvez aussi ajouter jusqu'à 3 autres photos. <a href="#/mon-profil/mes-photos">Ajouter mes photos</a></p></div>`);
    if (s.settings.paused) statusCard.insertAdjacentHTML("beforebegin",
      `<div class="alert alert--amber" id="paused-note">${icon("info")}<p>Votre profil est en pause : il n'apparaît plus dans les recherches. <a href="#/mon-profil">Le réactiver</a></p></div>`);

    /* Suggestions */
    const block = document.getElementById("suggestions-block");
    if (pending) {
      block.innerHTML = `
        <div class="card card--soft empty">
          ${icon("lock", 40)}
          <h3>Les profils seront accessibles après validation</h3>
          <p class="mb-0">En attendant, découvrez <a href="#/transparence">comment fonctionnent les suggestions</a>.</p>
        </div>`;
    } else if (!s.settings.suggestions) {
      block.innerHTML = `
        <div class="card card--soft empty">
          ${icon("compass", 40)}
          <h3>Vous avez désactivé les suggestions</h3>
          <p>La recherche reste entièrement disponible. Vous pouvez réactiver les suggestions dans <a href="#/mon-profil">Mon profil</a>.</p>
          <a class="btn btn--primary" href="#/recherche">Découvrir des profils</a>
        </div>`;
    } else {
      const list = CH.visibleProfiles(s).filter(p => p.suggested).slice(0, 3);
      document.getElementById("suggestions").innerHTML = list.length
        ? list.map(p => renderProfileCard(p, s)).join("")
        : `<p class="muted">Aucune nouvelle suggestion cette semaine.</p>`;
    }

    /* École du mariage : progression de chacun des conjoints */
    const schoolCard = document.getElementById("school-card");
    schoolCard.hidden = !CH.schoolActive(s);
    if (CH.schoolActive(s)) {
      const p = CH.profile(s.coupleWith);
      const cur = CH.module(CH.courseCurrent(s));
      const bar = (name, pct) => `<div class="flex between small" style="margin-top:10px"><span>${CH.escape(name)}</span><span class="muted">${pct}&nbsp;%</span></div>
        <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>`;
      schoolCard.innerHTML = `
        <h2 style="font-size:1.3rem;margin:0">${icon("book", 20)} École du mariage</h2>
        <p class="small muted" style="margin:6px 0 0">Module en cours : ${cur.id}. ${cur.title}</p>
        ${bar("Vous", CH.courseGlobal(s, "me"))}${bar(p.firstName, CH.courseGlobal(s, "partner"))}
        <a class="btn btn--primary btn--block" style="margin-top:16px" href="#/ecole">${icon("play", 16)} École du mariage</a>`;
    }

    /* Messagerie : non lus et membres en ligne */
    const chatCard = document.getElementById("chat-card");
    chatCard.hidden = pending;
    if (!pending) {
      const unread = CH.unreadTotal(s);
      const online = CH.chatMembers(s).filter(m => CH.presence(m.id).online);
      chatCard.innerHTML = !CH.memberPaid(s) ? `
        <h2 style="font-size:1.3rem">${icon("chat", 20)} Messagerie</h2>
        <p class="small muted">Réglez votre formule pour échanger avec les ${CH.chatMembers(s).length} membres actifs.</p>
        <a class="btn btn--primary btn--block" href="#/paiement">Régler ma formule</a>` : `
        <div class="flex between"><h2 style="font-size:1.3rem;margin:0">${icon("chat", 20)} Messages</h2>${unread ? `<span class="badge badge--primary">${unread} non lu${unread > 1 ? "s" : ""}</span>` : ""}</div>
        <div class="chat-teaser__online">
          <span class="chat-teaser__faces">${online.slice(0, 4).map(m => CH.avatar(m.firstName, m.colors, "sm", m.photo)).join("")}</span>
          <span class="small muted">${online.length} membre${online.length > 1 ? "s" : ""} en ligne</span>
        </div>
        <a class="btn ${unread ? "btn--primary" : "btn--ghost"} btn--block" href="#/messages">${unread ? "Lire mes messages" : "Ouvrir la messagerie"}</a>`;
    }

    /* Frise du parcours */
    let phase = "";
    document.getElementById("journey").innerHTML = CH_DATA.journey.map((step, i) => {
      const cls = i < idx ? "is-done" : i === idx ? "is-current" : "";
      const head = step.phase !== phase ? `<li class="journey__phase">${step.phase}</li>` : "";
      phase = step.phase;
      return `${head}<li class="journey__step ${cls}">
        <span class="journey__dot">${i < idx ? icon("check", 14) : i + 1}</span>
        <div><div class="journey__title">${step.title}</div>${i === idx ? `<div class="journey__desc">${step.desc}</div>` : ""}</div>
      </li>`;
    }).join("");
    const total = CH_DATA.journey.length;
    const pct = Math.min(100, Math.round((idx / (total - 1)) * 100));
    document.getElementById("journey-pct").textContent = idx >= total ? "Parcours accompli" : `Étape ${idx + 1} / ${total}`;
    document.getElementById("journey-bar").style.width = pct + "%";
  }

  render();
  const sugg = document.getElementById("suggestions");
  if (sugg) bindProfileActions(sugg, render);
  }
});
