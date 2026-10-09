/* Vue « Notre cheminement » — #/cheminement */
/* Notre cheminement : espace après intérêt réciproque */
App.view("cheminement", {
  layout: "app",
  title: "Notre cheminement",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Espace de mise en relation</span>
      <h1>Notre cheminement</h1>
    </div>
    <div id="walk"></div>
  </div>
${reportModal()}
`,
  init(ctx) {
  const root = document.getElementById("walk");
  const W = CH_DATA.walkPrompts;
  const s0 = Store.read();
  const id = CH.param("id") || Object.keys(s0.interests).find(k => ["relation", "couple"].includes(s0.interests[k]));
  const p = id && CH.profile(id);

  if (!p || !["relation", "couple"].includes(s0.interests[id])) {
    root.innerHTML = `
      <div class="card card--soft empty">
        ${icon("users", 44)}
        <h2 style="font-size:1.5rem">Votre espace s'ouvrira après un intérêt réciproque</h2>
        <p>Lorsque vous et une autre personne aurez manifesté votre intérêt l'un pour l'autre, vous accéderez ici à un espace pour apprendre à vous connaître.</p>
        <a class="btn btn--primary" href="#/recherche">Découvrir des profils</a>
      </div>`;
    return;
  }

  const replies = [
    "Merci pour votre partage, cela me touche beaucoup.",
    "C'est une belle question ! Laissez-moi y réfléchir un instant…",
    "Je me retrouve beaucoup dans ce que vous dites.",
    "J'aimerais beaucoup en parler de vive voix lors d'un appel."
  ];

  function render() {
    const s = Store.read();
    const isCouple = s.interests[p.id] === "couple";
    const done = s.discernment[p.id] || [];
    const pct = Math.round((done.length / W.discernment.length) * 100);
    const church = CH.church(p.churchId);
    const trial = CH.cheminantStatus(s, p.id);
    const unlockDay = CH.formatDate(trial.unlock.toISOString().slice(0, 10), { day: "numeric", month: "long" });

    root.innerHTML = `
      <div class="couple-banner" style="margin-bottom:24px">
        <div class="couple-banner__avatars">${CH.avatar(s.user.firstName + " " + s.user.lastName, s.user.colors, "lg")}${CH.avatar(p.firstName, p.colors, "lg")}</div>
        <div style="flex:1;min-width:220px">
          <h2 style="font-size:1.6rem;margin:0">${s.user.firstName} & ${p.firstName}</h2>
          <p class="mb-0 small">${p.city} · ${church.name}</p>
          <div class="pipeline" style="margin-top:8px">
            <span class="is-on">Intérêt</span><i>→</i><span class="is-on">Intérêt réciproque</span><i>→</i><span class="is-on">Mise en relation</span><i>→</i>
            <span class="${isCouple ? "is-on" : ""}">Couple en cheminement</span>
          </div>
        </div>
        ${isCouple
          ? `<a class="btn btn--primary" href="#/ecole">${icon("book", 18)} École du mariage</a>`
          : trial.unlocked
            ? `<a class="btn btn--primary" href="#/mon-profil/parcours-cheminant">${icon("ring", 18)} ${trial.me ? "Voir l'activation du parcours" : "Activer le parcours depuis mon profil"}</a>`
            : `<span class="badge badge--gold">${icon("lock", 13)} Parcours Cheminant activable le ${unlockDay}</span>`}
      </div>

      <div class="walk-layout">
        <section class="card chat" aria-label="Conversation">
          <div class="flex between" style="margin-bottom:12px">
            <h2 style="font-size:1.25rem;margin:0">Conversation</h2>
            <span class="small muted">${icon("shield", 14)} Échanges bienveillants · <a href="#/messages?id=${p.id}">Ouvrir dans Messages</a> · <button type="button" class="link-btn" data-report>Signaler</button></span>
          </div>
          <div class="chat__messages" id="messages" aria-live="polite"></div>
          <form class="chat__form" id="chat-form">
            <label for="chat-input" class="sr-only">Votre message</label>
            <input class="input" id="chat-input" placeholder="Écrire un message…" autocomplete="off">
            <button class="btn btn--primary" aria-label="Envoyer">${icon("send", 18)}</button>
          </form>
        </section>

        <aside class="stack" style="gap:20px">
          ${isCouple ? "" : `<section class="card">${cheminantGate(p, trial)}</section>`}
          <section class="card">
            <div class="flex between"><h3 class="mb-0" style="font-size:1.1rem">Étapes de discernement</h3><span class="badge badge--sage">${pct}&nbsp;%</span></div>
            <div class="progress" style="margin:12px 0 16px"><div class="progress__bar" style="width:${pct}%"></div></div>
            <ul class="checklist" id="discern">
              ${W.discernment.map((d, i) => `<li><label><input type="checkbox" data-i="${i}" ${done.includes(i) ? "checked" : ""}><span>${d}</span></label></li>`).join("")}
            </ul>
          </section>

          <section class="card">
            <h3 style="font-size:1.1rem">Questions pour apprendre à se connaître</h3>
            <p class="small muted">Cliquez pour l'insérer dans la conversation.</p>
            <div class="prompt-list">${W.questions.map(q => `<button class="prompt" type="button">${q}</button>`).join("")}</div>
          </section>

          <section class="card">
            <h3 style="font-size:1.1rem">Sujets de discussion</h3>
            <div class="profile-card__tags">${W.topics.map(t => `<span class="badge badge--sky">${t}</span>`).join("")}</div>
          </section>

          <section class="card" style="background:var(--color-gold-soft);border-color:transparent">
            <h3 style="font-size:1.1rem">${icon("pray", 18)} Prière</h3>
            <p class="prose" style="font-family:var(--font-title);font-style:italic">${W.prayer}</p>
            <button class="btn btn--light btn--sm" id="btn-pray">Nous avons prié aujourd'hui</button>
          </section>

          <section class="card">
            <h3 style="font-size:1.1rem">Ressources & conseils</h3>
            <ul class="conv-list">${W.resources.map(r => `<li><span>${r.title}</span><span class="badge">${r.type}</span></li>`).join("")}</ul>
            <div class="alert" style="margin-top:12px">${icon("info")}<p class="small">Conseil : privilégiez une première rencontre dans un lieu public, et n'hésitez pas à en parler à votre référent.</p></div>
          </section>
        </aside>
      </div>`;

    renderMessages();
    bind();
  }

  function renderMessages() {
    const s = Store.read();
    const box = document.getElementById("messages");
    box.innerHTML = (s.messages[p.id] || []).map(m =>
      `<div class="msg msg--${m.from}">${CH.escape(m.text)}${m.from !== "system" ? `<small>${CH.chatTime(m)}</small>` : ""}</div>`).join("");
    box.scrollTop = box.scrollHeight;
    CH.markRead(p.id);
  }

  function addMessage(from, text) {
    CH.postMessage(p.id, from, text);
    renderMessages();
  }

  function bind() {
    const input = document.getElementById("chat-input");
    document.getElementById("chat-form").addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addMessage("me", text);
      input.value = "";
      const t = setTimeout(() => addMessage("them", replies[Math.floor(Math.random() * replies.length)]), 1400);
      ctx.onLeave(() => clearTimeout(t));
    });
    document.querySelectorAll(".prompt").forEach(b => b.addEventListener("click", () => { input.value = b.textContent; input.focus(); }));
    document.getElementById("discern").addEventListener("change", e => {
      const i = Number(e.target.dataset.i);
      Store.update(s => {
        const arr = new Set(s.discernment[p.id] || []);
        e.target.checked ? arr.add(i) : arr.delete(i);
        s.discernment[p.id] = [...arr];
      });
      render();
    });
    document.getElementById("btn-pray").addEventListener("click", () => toast("Que Dieu bénisse votre cheminement."));
    bindReport({ getMember: () => p, context: "Notre cheminement" });
  }

  render();
  }
});
