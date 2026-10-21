/* Vue « École du mariage » — #/ecole[?module=…]
   Cours vidéo et audio, module par module. La progression de chaque conjoint
   est visible du couple, de son référent et de l'administrateur.
   Réservée aux couples entrés dans le parcours Cheminons (CH.schoolActive). */
App.view("ecole", {
  layout: "app",
  title: "École du mariage",
  mainClass: "app-main",
  template: () => CH.schoolActive(Store.read()) ? `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Parcours Cheminons</span>
      <div class="page-head__row">
        <h1>École du mariage</h1>
        <span class="badge badge--primary" id="couple-badge"></span>
      </div>
      <p class="lead" style="margin-top:12px">Des cours en vidéo et en audio, à suivre à deux et à votre rythme. Chaque module s'ouvre quand le précédent est terminé.</p>
    </div>

    <section class="card school-progress" id="school-progress" aria-label="Progression"></section>

    <div class="school-layout">
      <aside class="card school-modules" aria-label="Modules">
        <h2 class="school-modules__title">Modules</h2>
        <ol id="module-list"></ol>
        <a class="link-arrow small" href="#/parcours" style="margin-top:12px">Textes, questionnaires et exercices ${icon("arrow", 14)}</a>
      </aside>
      <div class="stack" style="gap:20px">
        <section class="card" id="player" aria-live="polite"></section>
        <section class="card" id="lesson-list"></section>
      </div>
    </div>
  </div>` : schoolLocked(),
  init(ctx) {
  const s0 = Store.read();
  if (!CH.schoolActive(s0)) return;

  const $ = id => document.getElementById(id);
  const partner = CH.profile(s0.coupleWith);
  $("couple-badge").textContent = `${s0.user.firstName} & ${partner.firstName}`;

  const wanted = Number(ctx.param("module"));
  let moduleId = wanted && CH.courseUnlocked(s0, wanted) ? wanted : CH.courseCurrent(s0);
  let lesson = firstUnwatched(moduleId);
  let playing = false, elapsed = 0, timer = null;
  ctx.onLeave(() => clearInterval(timer));

  function firstUnwatched(id) {
    const done = CH.courseDoneList(Store.read(), "me", id);
    const i = CH.courseLessons(id).findIndex(l => !done.includes(l.id));
    return i === -1 ? 0 : i;
  }
  /* Lien de lecture d'un cours : uniquement une adresse https (servie par l'Edge Function) */
  const mediaSrc = url => /^https:\/\/[^\s"'<>]+$/.test(String(url || "")) ? url : "";
  const mmss = sec => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  /* ---------- Progression du couple ---------- */
  function renderProgress() {
    const s = Store.read();
    const me = CH.courseGlobal(s, "me"), them = CH.courseGlobal(s, "partner");
    const current = CH.module(CH.courseCurrent(s));
    const row = (name, colors, pct) => `
      <div class="school-progress__row">
        ${CH.avatar(name, colors, "sm")}
        <div class="school-progress__bar">
          <div class="flex between small"><strong>${CH.escape(name)}</strong><span class="muted">${pct}&nbsp;%</span></div>
          <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    $("school-progress").innerHTML = `
      <div class="school-progress__head">
        <h2>Votre progression</h2>
        <span class="small muted">Module en cours : <strong>${current.id}. ${current.title}</strong></span>
      </div>
      <div class="school-progress__rows">
        ${row(`${s.user.firstName} (vous)`, s.user.colors, me)}
        ${row(partner.firstName, partner.colors, them)}
      </div>
      <p class="small muted mb-0">${icon("church", 14)} Votre référent, ${CH.escape(CH.church(s.user.churchId).referent)}, voit cette progression et peut vous encourager.</p>`;
  }

  /* ---------- Liste des modules ---------- */
  function renderModules() {
    const s = Store.read();
    $("module-list").innerHTML = CH_DATA.modules.map(m => {
      const pct = CH.courseProgress(s, "me", m.id);
      const open = CH.courseUnlocked(s, m.id);
      const state = pct === 100 ? "is-done" : open ? "" : "is-locked";
      return `<li><button type="button" class="school-mod ${state}" data-module="${m.id}" ${open ? "" : "disabled"} aria-current="${m.id === moduleId}">
        <span class="school-mod__num">${pct === 100 ? icon("check", 14) : open ? m.id : icon("lock", 13)}</span>
        <span class="school-mod__body"><span>${m.title}</span>
          ${open ? `<span class="progress"><span class="progress__bar" style="width:${pct}%"></span></span>` : `<span class="small muted">Après le module ${m.id - 1}</span>`}</span>
        ${open ? `<span class="small muted">${pct}&nbsp;%</span>` : ""}
      </button></li>`;
    }).join("");
  }

  /* ---------- Lecteur : fichier audio ou vidéo, lecture simulée en démo ---------- */
  function renderPlayer() {
    const s = Store.read();
    const m = CH.module(moduleId);
    const l = CH.courseLessons(moduleId)[lesson];
    if (!l) {
      $("player").innerHTML = `
        <p class="kicker mb-0">Module ${m.id}</p>
        <h2 class="player__title">${m.title}</h2>
        <p class="muted mb-0">Les cours de ce module seront bientôt disponibles.</p>`;
      return;
    }
    const src = mediaSrc(l.url);
    const total = l.minutes * 60;
    const done = CH.courseDoneList(s, "me", moduleId).includes(l.id);
    const pct = Math.min(100, (elapsed / total) * 100);
    const controls = `
      <div class="player__controls">
        <button class="btn btn--primary btn--icon" id="btn-play" aria-label="${playing ? "Pause" : "Lecture"}">${icon(playing ? "pause" : "play", 20)}</button>
        <div class="player__track">
          <div class="progress" role="progressbar" aria-label="Avancement du cours" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div class="progress__bar" style="width:${pct}%"></div></div>
          <div class="flex between small muted"><span>${mmss(elapsed)}</span><span>${mmss(total)}</span></div>
        </div>
      </div>`;
    $("player").innerHTML = `
      <p class="kicker mb-0">Module ${m.id} · ${l.type === "video" ? "Vidéo" : "Audio"} ${lesson + 1} sur ${CH.courseLessons(moduleId).length}</p>
      <h2 class="player__title">${CH.escape(l.title)}</h2>
      <p class="small muted">${l.speaker ? `${icon("users", 14)} ${CH.escape(l.speaker)} · ` : ""}${l.minutes} min</p>
      ${l.description ? `<p class="small">${CH.escape(l.description)}</p>` : ""}
      ${src
        ? (l.type === "video"
          ? `<video class="player__video" id="media" controls preload="metadata" playsinline src="${CH.escape(src)}"></video>`
          : `<div class="audio-player player__audio">${icon("audio", 28)}<span><strong>Écoute</strong><br><span class="small muted">À écouter ensemble ou chacun de son côté</span></span></div>
             <audio class="player__audio-el" id="media" controls preload="metadata" src="${CH.escape(src)}"></audio>`)
        : `${l.type === "video"
          ? `<div class="media player__screen">${playing ? `<p class="small" style="opacity:.8">Lecture en cours…</p>` : `<button class="media__play" id="btn-big" aria-label="Lancer la vidéo">${icon("play", 28)}</button>`}</div>`
          : `<div class="audio-player player__audio">${icon("audio", 28)}<span><strong>Écoute</strong><br><span class="small muted">À écouter ensemble ou chacun de son côté</span></span></div>`}
        ${controls}`}
      ${m.sensitive ? `<p class="small" style="color:var(--color-primary-dark);margin:12px 0 0">${icon("info", 14)} Contenus élaborés avec des responsables pastoraux et des professionnels compétents.</p>` : ""}
      <div class="flex between" style="margin-top:16px">
        ${done ? `<span class="badge badge--sage">${icon("check", 13)} Cours suivi</span>` : `<button class="btn btn--ghost btn--sm" id="btn-mark">Marquer comme suivi</button>`}
        ${src ? "" : `<span class="small muted">Démo : lecture accélérée</span>`}
      </div>`;
    $("btn-play")?.addEventListener("click", toggle);
    $("btn-big")?.addEventListener("click", toggle);
    // Cours écouté ou regardé jusqu'au bout : marqué comme suivi
    $("media")?.addEventListener("ended", () => { if (!CH.courseDoneList(Store.read(), "me", moduleId).includes(l.id)) complete(); });
    $("btn-mark")?.addEventListener("click", complete);
  }

  function toggle() {
    playing = !playing;
    clearInterval(timer);
    if (playing) {
      const total = CH.courseLessons(moduleId)[lesson].minutes * 60;
      timer = setInterval(() => {
        elapsed = Math.min(total, elapsed + total / 32); // environ 8 secondes en démo
        if (elapsed >= total) return complete();
        renderPlayer();
      }, 250);
    }
    renderPlayer();
  }

  function complete() {
    clearInterval(timer);
    playing = false;
    const unlockedBefore = CH.courseUnlocked(Store.read(), moduleId + 1);
    CH.markLesson(moduleId, CH.courseLessons(moduleId)[lesson].id);
    const s = Store.read();
    elapsed = 0;
    if (CH.courseProgress(s, "me", moduleId) === 100) {
      const next = moduleId < CH_DATA.modules.length && CH.courseUnlocked(s, moduleId + 1);
      toast(next && !unlockedBefore
        ? `Module ${moduleId} terminé : le module ${moduleId + 1} est ouvert.`
        : `Module ${moduleId} terminé. Votre référent en est informé.`);
      if (next) moduleId += 1; // on enchaîne sur le module suivant
    } else {
      toast("Cours suivi. Place au cours suivant.");
    }
    lesson = firstUnwatched(moduleId); // cours suivant non encore suivi
    renderAll();
  }

  /* ---------- Cours du module ---------- */
  function renderLessons() {
    const s = Store.read();
    const m = CH.module(moduleId);
    const mine = CH.courseDoneList(s, "me", moduleId);
    const theirs = CH.courseDoneList(s, "partner", moduleId);
    if (!CH.courseLessons(moduleId).length) {
      $("lesson-list").innerHTML = `<h2 style="font-size:1.25rem;margin:0 0 8px">Module ${m.id} : ${m.title}</h2>
        <p class="small muted">« ${m.verse[0]} » ${m.verse[1]}</p>
        <p class="muted mb-0">Aucun cours n'est encore en ligne pour ce module.</p>`;
      return;
    }
    $("lesson-list").innerHTML = `
      <div class="flex between" style="margin-bottom:8px">
        <h2 style="font-size:1.25rem;margin:0">Module ${m.id} : ${m.title}</h2>
        <span class="badge badge--gold">${icon("clock", 13)} ${CH.courseLessons(moduleId).reduce((n, l) => n + l.minutes, 0)} min</span>
      </div>
      <p class="small muted">« ${m.verse[0]} » ${m.verse[1]}</p>
      <ol class="lessons">${CH.courseLessons(moduleId).map((l, i) => `
        <li><button type="button" class="lesson ${mine.includes(l.id) ? "is-done" : ""}" data-lesson="${i}" aria-current="${i === lesson}">
          <span class="lesson__type">${icon(l.type, 16)}</span>
          <span class="lesson__body"><strong>${CH.escape(l.title)}</strong><span class="small muted">${l.type === "video" ? "Vidéo" : "Audio"} · ${l.minutes} min${l.speaker ? ` · ${CH.escape(l.speaker)}` : ""}</span></span>
          <span class="lesson__status small">
            ${mine.includes(l.id) ? `<span class="badge badge--sage">${icon("check", 12)} Vous</span>` : ""}
            ${theirs.includes(l.id) ? `<span class="badge badge--sky">${icon("check", 12)} ${CH.escape(partner.firstName)}</span>` : ""}
          </span>
        </button></li>`).join("")}</ol>`;
  }

  function renderAll() {
    if (lesson >= CH.courseLessons(moduleId).length) lesson = firstUnwatched(moduleId);
    renderProgress(); renderModules(); renderPlayer(); renderLessons();
  }

  /* Mode supabase : cours ajoutés par l'administrateur, module qui vient de s'ouvrir…
     L'écran suit l'état rechargé, sans interrompre un cours en cours de lecture. */
  let shown = JSON.stringify(CH_DATA.courses);
  if (Remote.on) App.onDocument("cheminant:remote", () => {
    const now = JSON.stringify(CH_DATA.courses);
    const media = $("media");
    if (now === shown || (media && !media.paused) || playing) return;
    shown = now;
    renderAll();
  });

  $("module-list").addEventListener("click", e => {
    const b = e.target.closest("[data-module]");
    if (!b || b.disabled) return;
    clearInterval(timer);
    moduleId = Number(b.dataset.module);
    lesson = firstUnwatched(moduleId);
    playing = false; elapsed = 0;
    renderAll();
    $("player").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
  $("lesson-list").addEventListener("click", e => {
    const b = e.target.closest("[data-lesson]");
    if (!b) return;
    clearInterval(timer);
    lesson = Number(b.dataset.lesson);
    playing = false; elapsed = 0;
    renderAll();
    $("player").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  renderAll();
  }
});
