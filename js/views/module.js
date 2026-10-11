/* Vue « Module » — #/module */
/* Détail d'un module de l'École du mariage */
App.view("module", {
  layout: "app",
  title: "Module",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <a href="#/parcours" class="small" style="text-decoration:none;display:inline-flex;gap:6px;align-items:center"><i data-icon="back" data-size="16"></i> École du mariage</a>
      <span class="eyebrow" id="m-eyebrow" style="display:block;margin-top:16px"></span>
      <h1 id="m-title"></h1>
    </div>

    <div class="lesson-layout">
      <aside class="card lesson-nav">
        <div class="flex between small" style="margin-bottom:8px"><strong>Contenu du module</strong><span class="muted" id="m-pct"></span></div>
        <div class="progress" style="margin-bottom:16px"><div class="progress__bar" id="m-bar"></div></div>
        <ol id="lessons"></ol>
      </aside>
      <section class="card" id="lesson" aria-live="polite"></section>
    </div>
  </div>
`,
  init(ctx) {
  const m = CH.module(CH.param("id")) || CH_DATA.modules[0];
  const formats = CH_DATA.lessonFormats;
  let current = 0;

  if (!CH.moduleUnlocked(Store.read(), m.id)) {
    location.replace("#/parcours");
    return;
  }

  document.title = `Module ${m.id} : ${m.title} | Cheminant`;
  document.getElementById("m-eyebrow").textContent = `Module ${m.id} sur ${CH_DATA.modules.length} · ${m.duration}`;
  document.getElementById("m-title").textContent = m.title;

  const doneList = () => Store.read().modules[m.id] || [];
  const first = formats.findIndex((_, i) => !doneList().includes(i));
  current = first === -1 ? 0 : first;

  function renderNav() {
    const done = doneList();
    const pct = Math.round((done.length / formats.length) * 100);
    document.getElementById("m-pct").textContent = `${pct} %`;
    document.getElementById("m-bar").style.width = pct + "%";
    document.getElementById("lessons").innerHTML = formats.map((f, i) => `
      <li class="${done.includes(i) ? "is-done" : ""}">
        <button data-i="${i}" aria-current="${i === current}">
          <span class="tick">${done.includes(i) ? icon("check", 14) : ""}</span>
          ${icon(f.icon, 18)} <span>${f.label}</span>
        </button>
      </li>`).join("");
  }

  const quiz = [
    { q: `Dans ce module, qu'est-ce qui vous parle le plus au sujet de « ${m.topics[0].toLowerCase()} » ?`, a: ["Une découverte", "Une confirmation", "Une remise en question"] },
    { q: `Avez-vous déjà abordé « ${m.topics[1].toLowerCase()} » en couple ?`, a: ["Oui, en profondeur", "Un peu", "Pas encore"] },
    { q: `Sur « ${m.topics[2].toLowerCase()} », vous vous sentez :`, a: ["Serein(e)", "Partagé(e)", "Besoin d'en parler"] }
  ];

  function content(f) {
    switch (f.type) {
      case "video": return `
        <div class="media">
          <div>
            <button class="media__play" aria-label="Lire la vidéo" id="play">${icon("play", 30)}</button>
            <p style="margin:14px 0 0;font-weight:700">Introduction : ${m.title}</p>
            <p class="small" style="opacity:.75">Vidéo · 18 min</p>
          </div>
        </div>
        <p style="margin-top:20px">Dans cette vidéo, un couple pastoral introduit les grands thèmes du module : ${m.topics.join(", ").toLowerCase()}.</p>`;
      case "audio": return `
        <p>Méditation audio à écouter ensemble ou séparément, avant d'en discuter.</p>
        <div class="audio-player">
          <button class="btn btn--primary" id="audio-btn" aria-label="Lire l'audio" style="width:52px;height:52px;padding:0">${icon("play", 20)}</button>
          <div style="flex:1"><strong>Méditation : ${m.title}</strong><div class="progress" style="margin-top:8px"><div class="progress__bar" id="audio-bar" style="width:0%"></div></div></div>
          <span class="small muted">12:40</span>
        </div>`;
      case "texte": return `
        <div class="prose">
          <h2 style="font-size:1.5rem">${m.title}</h2>
          <blockquote>« ${m.verse[0]} »<br><small style="font-family:var(--font-body);font-style:normal;font-weight:700">${m.verse[1]}</small></blockquote>
          <p>Ce module vous invite à prendre le temps d'aborder ensemble des thèmes essentiels pour la construction de votre foyer. Il ne s'agit pas d'avoir toutes les réponses, mais d'apprendre à se parler en vérité et dans l'amour.</p>
          <h3>Ce que nous allons explorer</h3>
          <ul>${m.topics.map(t => `<li><strong>${t}</strong></li>`).join("")}</ul>
          <p>Prenez des notes au fil de votre lecture : elles nourriront l'exercice individuel et vos échanges avec votre accompagnateur.</p>
        </div>`;
      case "pdf": return `
        <p>Le support complet du module, à imprimer ou à garder sur votre téléphone.</p>
        <div class="pdf-card">
          <span class="card__icon" style="margin:0">${icon("pdf", 24)}</span>
          <div style="flex:1"><strong>Cheminant, module ${m.id}, ${m.title}.pdf</strong><br><span class="small muted">24 pages · 2,1 Mo</span></div>
          <button class="btn btn--ghost btn--sm" id="pdf-btn">${icon("download", 16)} Télécharger</button>
        </div>`;
      case "questionnaire": return `
        <p>Répondez individuellement, puis comparez vos réponses avec votre fiancé(e).</p>
        <form id="quiz">${quiz.map((item, i) => `
          <fieldset class="quiz-q"><p>${i + 1}. ${item.q}</p>
            ${item.a.map(a => `<label><input type="radio" name="q${i}" value="${a}" required> ${a}</label>`).join("")}
          </fieldset>`).join("")}
        </form>`;
      case "exercice": {
        const notes = Store.read().notes?.[m.id] || "";
        return `
        <p>Prenez 20 minutes seul(e) pour répondre par écrit. Vous pourrez choisir de partager ou non vos réponses.</p>
        <div class="alert alert--gold" style="margin-bottom:16px">${icon("pen")}<p>Quelle est votre plus grande attente concernant « ${m.topics[0].toLowerCase()} » ? Qu'avez-vous reçu de votre famille sur ce sujet, et que souhaitez-vous transmettre ?</p></div>
        <div class="field"><label for="notes">Mes réflexions</label><textarea class="textarea" id="notes" style="min-height:180px">${CH.escape(notes)}</textarea><span class="hint">Enregistré uniquement sur cet appareil.</span></div>`;
      }
    }
  }

  function renderLesson() {
    const f = formats[current];
    const done = doneList().includes(current);
    const isLast = current === formats.length - 1;
    const el = document.getElementById("lesson");
    el.innerHTML = `
      <div class="flex between" style="margin-bottom:18px">
        <span class="badge badge--primary">${icon(f.icon, 14)} ${f.label}</span>
        <span class="small muted">Étape ${current + 1} / ${formats.length}</span>
      </div>
      ${content(f)}
      <div class="flex between" style="margin-top:28px;padding-top:20px;border-top:1px solid var(--color-line)">
        <button class="btn btn--ghost" id="prev" ${current === 0 ? "disabled" : ""}>Précédent</button>
        <button class="btn ${done ? "btn--sage" : "btn--primary"}" id="complete">
          ${done ? `${icon("check", 18)} ${isLast ? "Module terminé" : "Étape suivante"}` : isLast ? "Terminer le module" : "Terminer et continuer"}
        </button>
      </div>`;
    bindLesson();
  }

  function bindLesson() {
    const $ = id => document.getElementById(id);
    $("prev").addEventListener("click", () => { current--; render(); });
    $("complete").addEventListener("click", () => {
      if (formats[current].type === "questionnaire" && !$("quiz").checkValidity()) {
        $("quiz").reportValidity();
        return;
      }
      const notes = formats[current].type === "exercice" ? $("notes").value : undefined;
      if (notes !== undefined) {
        Store.update(s => { s.notes = s.notes || {}; s.notes[m.id] = notes; });
      }
      Store.update(s => {
        const set = new Set(s.modules[m.id] || []);
        set.add(current);
        s.modules[m.id] = [...set];
      });
      const index = current;
      Remote.push(() => Api.school.completeLesson(m.id, index, notes));
      if (CH.moduleDone(Store.read(), m.id) && current === formats.length - 1) {
        toast(`Module ${m.id} terminé ! Que Dieu bénisse votre préparation.`);
        setTimeout(() => (location.href = "#/parcours"), 1200);
        return render();
      }
      current = Math.min(current + 1, formats.length - 1);
      render();
    });
    $("play")?.addEventListener("click", () => toast("Lecture vidéo (démo)"));
    $("pdf-btn")?.addEventListener("click", () => toast("Téléchargement du PDF (démo)"));
    const audioBtn = $("audio-btn");
    if (audioBtn) {
      let timer = null, pos = 0;
      audioBtn.addEventListener("click", () => {
        if (timer) { clearInterval(timer); timer = null; audioBtn.innerHTML = icon("play", 20); return; }
        audioBtn.innerHTML = icon("pause", 20);
        timer = setInterval(() => {
          pos = Math.min(pos + 2, 100);
          const bar = $("audio-bar");
          if (!bar) return clearInterval(timer);
          bar.style.width = pos + "%";
          if (pos === 100) { clearInterval(timer); timer = null; audioBtn.innerHTML = icon("play", 20); }
        }, 200);
      });
    }
  }

  function render() { renderNav(); renderLesson(); }

  document.getElementById("lessons").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]");
    if (b) { current = Number(b.dataset.i); render(); }
  });

  render();
  }
});
