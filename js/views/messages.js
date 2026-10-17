/* Vue « Messages » — #/messages[?id=…] */
/* Messagerie entre membres validés par leur référent et à jour de leur formule */
App.view("messages", {
  layout: "app",
  title: "Messages",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head page-head__row">
      <div>
        <span class="eyebrow">Communauté Cheminant</span>
        <h1>Messages</h1>
      </div>
      <p class="small muted mb-0" style="max-width:420px">Échangez avec les membres validés par leur église. Chaque conversation reste bienveillante et confidentielle.</p>
    </div>
    <div id="chat-root"></div>
  </div>

<!-- Modale : nouvelle conversation -->
<div class="modal" id="modal-new" role="dialog" aria-modal="true" aria-labelledby="new-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="new-title" style="font-size:1.5rem">Nouvelle conversation</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="small muted">Seuls les membres validés par leur référent et à jour de leur formule apparaissent ici.</p>
    <div class="field"><label for="new-search">Rechercher un membre</label><input class="input" id="new-search" placeholder="Prénom, ville, église…" autocomplete="off"></div>
    <ul class="member-pick" id="new-list"></ul>
  </div>
</div>

<!-- Modale : signaler -->
${reportModal()}

<!-- Modale : bloquer -->
<div class="modal" id="modal-block" role="dialog" aria-modal="true" aria-labelledby="block-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="block-title" style="font-size:1.5rem">Bloquer <span id="block-name"></span> ?</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">La conversation disparaîtra de votre messagerie et ce membre ne pourra plus vous écrire. Vous pourrez le débloquer à tout moment.</p>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Annuler</button>
      <button class="btn btn--danger" id="block-confirm">Bloquer</button>
    </div>
  </div>
</div>

<!-- Modale : charte des échanges (première visite) -->
<div class="modal" id="modal-charter" role="dialog" aria-modal="true" aria-labelledby="charter-title">
  <div class="modal__box">
    <p class="kicker">Avant votre premier message</p>
    <h2 id="charter-title" style="font-size:1.6rem">La charte des échanges</h2>
    <ol class="charter">${CH_DATA.chat.charter.map(c => `<li>${c}</li>`).join("")}</ol>
    <label class="check"><input type="checkbox" id="charter-ok"><span>Je m'engage à respecter cette charte.</span></label>
    <div class="modal__actions">
      <a class="btn btn--ghost" href="#/tableau-de-bord">Plus tard</a>
      <button class="btn btn--primary" id="charter-accept" disabled>Commencer à échanger</button>
    </div>
  </div>
</div>
`,
  init(ctx) {
  const root = document.getElementById("chat-root");
  const C = CH_DATA.chat;
  const s0 = Store.read();
  const id = ctx.param("id");
  const p = id && CH.profile(id);
  let filter = "all", query = "", typing = false, timers = [], shown = 0; // shown : messages déjà affichés (seuls les nouveaux sont animés)
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  ctx.onLeave(() => timers.forEach(clearTimeout));

  /* ---------- Accès : profil validé puis formule réglée ---------- */
  if (s0.user.status !== "actif") {
    root.innerHTML = `
      <div class="card card--soft empty">
        ${icon("lock", 44)}
        <h2 style="font-size:1.5rem">La messagerie s'ouvre après la validation de votre profil</h2>
        <p>Votre référent doit d'abord valider votre candidature. Vous pourrez ensuite échanger avec les autres membres.</p>
        <a class="btn btn--primary" href="#/tableau-de-bord">Suivre ma validation</a>
      </div>`;
    return;
  }
  if (!CH.memberPaid(s0)) {
    const plan = s0.user.plan || "single";
    const price = CH.price(CH.region(s0.user.churchId), plan);
    root.innerHTML = `
      <div class="card chat-gate">
        <span class="card__icon card__icon--sage" style="width:64px;height:64px">${icon("shield", 28)}</span>
        <span class="badge badge--sage">Profil validé</span>
        <h2 style="font-size:1.6rem;margin:12px 0 8px">Activez votre formule pour échanger</h2>
        <p class="muted">Votre référent a validé votre profil. Il ne reste qu'à régler votre formule ${CH_DATA.plans[plan].name} (${CH.money(price.amount, price.currency)} ${price.period}) pour écrire aux ${CH.chatMembers(s0).length} membres déjà actifs.</p>
        <a class="btn btn--primary btn--lg" href="#/paiement">Régler ma formule</a>
        ${Remote.on ? "" : `<p class="small muted" style="margin:12px 0 0">Démo : aucun paiement n'est réellement effectué.</p>`}
      </div>`;
    return;
  }
  if (id && (!CH.chatEligible(p) || s0.blocked.includes(id))) {
    toast("Cette conversation n'est pas disponible.");
    location.replace("#/messages");
    return;
  }

  /* ---------- Gabarit ---------- */
  root.innerHTML = `
    <div class="inbox ${p ? "has-thread" : ""}">
      <aside class="inbox__side" aria-label="Conversations">
        <div class="inbox__head">
          <h2>Conversations</h2>
          <button class="btn btn--primary btn--sm" id="btn-new">${icon("pen", 16)} Nouveau</button>
        </div>
        <div class="online" id="online"></div>
        <div class="inbox__tools">
          <label for="conv-search" class="sr-only">Rechercher une conversation</label>
          <input class="input" id="conv-search" type="search" placeholder="Rechercher…" autocomplete="off">
          <div class="seg" role="group" aria-label="Filtrer">
            <button type="button" data-filter="all" aria-pressed="true">Toutes</button>
            <button type="button" data-filter="unread" aria-pressed="false">Non lues</button>
          </div>
        </div>
        <ul class="conv" id="conv-list"></ul>
        <div id="blocked"></div>
      </aside>
      <section class="inbox__main" id="thread" aria-label="Fil de discussion"></section>
    </div>`;

  /* ---------- Liste des conversations ---------- */
  function dot(pid) { return CH.presence(pid).online ? `<span class="presence-dot" aria-hidden="true"></span>` : ""; }
  function avatarWithDot(person, size = "sm") {
    return `<span class="avatar-wrap">${CH.avatar(person.firstName, person.colors, size, person.photo)}${dot(person.id)}</span>`;
  }

  function renderSide() {
    const s = Store.read();
    const convs = CH.conversations(s);
    const unreadCount = convs.filter(c => c.unread).length;
    document.querySelector('[data-filter="unread"]').innerHTML = `Non lues${unreadCount ? ` <span class="pill">${unreadCount}</span>` : ""}`;

    const online = CH.chatMembers(s).filter(m => CH.presence(m.id).online);
    document.getElementById("online").innerHTML = online.length ? `
      <p class="online__label"><span class="online__dot" aria-hidden="true"></span>En ligne maintenant</p>
      <ul class="online__list">${online.map(m => `
        <li><a href="#/messages?id=${m.id}" aria-label="Écrire à ${CH.escape(m.firstName)}, en ligne">${avatarWithDot(m)}<span>${CH.escape(m.firstName)}</span></a></li>`).join("")}</ul>` : "";

    const q = query.toLowerCase();
    const list = convs.filter(c => (filter === "all" || c.unread) && `${c.p.firstName} ${c.p.city}`.toLowerCase().includes(q));
    document.getElementById("conv-list").innerHTML = list.length ? list.map(c => {
      const mine = c.last.from === "me";
      const rel = ["relation", "couple"].includes(s.interests[c.p.id]);
      return `<li><a class="conv__item ${c.unread ? "is-unread" : ""}" href="#/messages?id=${c.p.id}" ${c.p.id === id ? 'aria-current="true"' : ""}>
        ${avatarWithDot(c.p)}
        <span class="conv__body">
          <span class="conv__top"><strong>${CH.escape(c.p.firstName)}</strong><time>${CH.chatTime(c.last)}</time></span>
          <span class="conv__preview">${rel ? `<span class="badge badge--sage">${icon("users", 12)} Mise en relation</span> ` : ""}${mine ? "Vous : " : ""}${CH.escape(c.last.text)}</span>
        </span>
        ${c.unread ? `<span class="pill" aria-label="${c.unread} non lu${c.unread > 1 ? "s" : ""}">${c.unread}</span>` : ""}
      </a></li>`;
    }).join("") : `<li class="small muted conv__empty">${filter === "unread" ? "Vous avez tout lu. Belle journée !" : "Aucune conversation trouvée."}</li>`;

    const blocked = s.blocked.map(CH.profile).filter(Boolean);
    document.getElementById("blocked").innerHTML = blocked.length ? `
      <details class="blocked"><summary>Membres bloqués (${blocked.length})</summary>
        <ul>${blocked.map(b => `<li><span>${CH.escape(b.firstName)}</span><button class="link-btn" data-unblock="${b.id}">Débloquer</button></li>`).join("")}</ul>
      </details>` : "";
  }

  /* ---------- Fil de discussion ---------- */
  function starters(person) {
    return C.starters
      .filter(t => (!t.includes("{interest}") || person.interests.length) && (!t.includes("{service}") || person.service))
      .map((t, i) => t
        .replace("{interest}", person.interests[i % person.interests.length])
        .replace("{service}", person.service));
  }

  function renderWelcome() {
    const s = Store.read();
    const verse = C.verses[new Date().getDay()];
    const withConv = new Set(CH.conversations(s).map(c => c.p.id));
    const discover = CH.chatMembers(s).filter(m => !withConv.has(m.id)).sort((a, b) => CH.presence(a.id).online ? -1 : CH.presence(b.id).online ? 1 : 0).slice(0, 4);
    const unread = CH.unreadTotal(s);
    document.getElementById("thread").innerHTML = `
      <div class="welcome">
        <p class="kicker">Parole du jour</p>
        <blockquote class="welcome__verse">« ${verse[0]} »<cite>${verse[1]}</cite></blockquote>
        <p class="muted">${unread ? `Vous avez <strong>${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}</strong>. Quelqu'un attend peut-être votre réponse.` : "Choisissez une conversation ou saluez un membre que vous ne connaissez pas encore."}</p>
        ${discover.length ? `
        <h3 class="welcome__title">Membres à rencontrer</h3>
        <ul class="discover">${discover.map(m => {
          const church = CH.church(m.churchId);
          return `<li class="discover__item">
            ${avatarWithDot(m)}
            <span class="discover__body"><strong>${CH.escape(m.firstName)}, ${m.age} ans</strong><span class="small muted">${CH.escape(m.city)} · ${CH.escape(m.service)} · ${CH.presence(m.id).label}</span><span class="small muted">${CH.escape(church.name)}</span></span>
            <button class="btn btn--ghost btn--sm" data-hello="${m.id}">Dire bonjour</button>
          </li>`;
        }).join("")}</ul>` : ""}
      </div>`;
  }

  function renderThread() {
    const s = Store.read();
    const church = CH.church(p.churchId);
    const pres = CH.presence(p.id);
    const rel = ["relation", "couple"].includes(s.interests[p.id]);
    const sameGender = p.gender === s.user.gender;
    document.getElementById("thread").innerHTML = `
      <header class="thread__head">
        <a class="icon-btn thread__back" href="#/messages" aria-label="Retour aux conversations">${icon("back", 18)}</a>
        ${avatarWithDot(p)}
        <div class="thread__who">
          <strong>${CH.escape(p.firstName)}, ${p.age} ans</strong>
          <span class="small ${pres.online ? "thread__online" : "muted"}" id="presence">${pres.label}</span>
        </div>
        <div class="thread__actions">
          <a class="icon-btn" href="#/profil?id=${p.id}" aria-label="Voir le profil de ${CH.escape(p.firstName)}" title="Voir le profil">${icon("eye", 18)}</a>
          <button class="icon-btn" data-report aria-label="Signaler" title="Signaler">${icon("shield", 18)}</button>
          <button class="icon-btn" data-act="block" aria-label="Bloquer ${CH.escape(p.firstName)}" title="Bloquer">${icon("lock", 18)}</button>
        </div>
      </header>
      <div class="thread__meta">
        <span class="badge badge--sage">${icon("shield", 12)} Validé par ${CH.escape(church.referent)}</span>
        <span class="small muted">${CH.escape(church.name)} · ${CH.escape(p.city)}</span>
        <span class="thread__safety small"><button type="button" class="link-btn" data-report>Signaler</button> · <button type="button" class="link-btn" data-act="block">Bloquer</button></span>
        ${rel ? `<a class="badge badge--primary" href="#/cheminement?id=${p.id}">${icon("pray", 12)} Notre cheminement</a>` : sameGender ? `<span class="badge badge--sky">${icon("users", 12)} Échange fraternel</span>` : ""}
      </div>
      <div class="thread__messages" id="messages" aria-live="polite" aria-relevant="additions"></div>
      <div class="starters" id="starters" hidden>
        <p class="small muted">Idées pour ${(s.messages[p.id] || []).some(m => m.from !== "system") ? "relancer" : "lancer"} la conversation :</p>
        <div class="starters__list">${starters(p).map(t => `<button type="button" class="prompt">${CH.escape(t)}</button>`).join("")}</div>
      </div>
      <form class="composer" id="composer">
        <button type="button" class="icon-btn" id="btn-ideas" aria-expanded="false" aria-controls="starters" aria-label="Idées de messages" title="Idées de messages">${icon("quiz", 18)}</button>
        <label for="composer-input" class="sr-only">Message à ${CH.escape(p.firstName)}</label>
        <textarea class="input composer__input" id="composer-input" rows="1" maxlength="2000" placeholder="Écrire à ${CH.escape(p.firstName)}…"></textarea>
        <button class="btn btn--primary btn--icon" id="composer-send" aria-label="Envoyer" disabled>${icon("send", 18)}</button>
      </form>`;
    renderMessages();
    bindThread();
  }

  function renderMessages() {
    const s = Store.read();
    const msgs = s.messages[p.id] || [];
    const box = document.getElementById("messages");
    if (!msgs.some(m => m.from !== "system")) {
      box.innerHTML = `
        <div class="thread__start">
          ${CH.avatar(p.firstName, p.colors, "lg", p.photo)}
          <p><strong>Commencez la conversation avec ${CH.escape(p.firstName)}</strong></p>
          ${p.quote ? `<p class="small muted">« ${CH.escape(p.quote)} »</p>` : ""}
          ${p.interests.length ? `<p class="small muted">Centres d'intérêt : ${CH.escape(p.interests.join(", "))}</p>` : ""}
        </div>`;
      document.getElementById("starters").hidden = false;
      document.getElementById("btn-ideas").setAttribute("aria-expanded", "true");
    } else {
      let day = "";
      const lastMine = msgs.map(m => m.from).lastIndexOf("me");
      const seen = msgs.slice(lastMine + 1).some(m => m.from === "them") || CH.presence(p.id).online;
      box.innerHTML = msgs.map((m, i) => {
        const d = CH.chatDay(m);
        const sep = d && d !== day ? `<div class="day-sep"><span>${d}</span></div>` : "";
        day = d || day;
        if (m.from === "system") return `${sep}<div class="msg msg--system">${CH.escape(m.text)}</div>`;
        const r = C.reactions.find(x => x.key === m.react);
        return `${sep}<div class="bubble bubble--${m.from}${shown && i >= shown ? " is-new" : ""}">
          <div class="msg msg--${m.from}">${CH.escape(m.text).replace(/\n/g, "<br>")}
            <small>${CH.chatTime(m, true)}${i === lastMine ? ` · ${seen ? "Lu" : "Envoyé"}` : ""}</small></div>
          ${r ? `<button type="button" class="reaction" data-react-toggle="${i}" aria-label="Réaction : ${r.label}. Modifier">${icon(r.icon, 13)} ${r.label}</button>` : ""}
          <button type="button" class="bubble__more" data-react-toggle="${i}" aria-label="Réagir au message" aria-expanded="false">${icon("heart", 14)}</button>
          <div class="react-menu" data-menu="${i}" hidden>${C.reactions.map(x =>
            `<button type="button" data-react="${i}" data-key="${x.key}" aria-pressed="${m.react === x.key}">${icon(x.icon, 14)} ${x.label}</button>`).join("")}</div>
        </div>`;
      }).join("") + (typing ? `<div class="typing" aria-label="${CH.escape(p.firstName)} écrit"><span></span><span></span><span></span></div>` : "");
    }
    shown = msgs.length;
    box.scrollTop = box.scrollHeight;
    CH.markRead(p.id);
  }

  function setTyping(on) {
    typing = on;
    const el = document.getElementById("presence");
    if (el) el.textContent = on ? `${p.firstName} écrit…` : CH.presence(p.id).label;
    renderMessages();
  }

  /* Réponse simulée : contextuelle (question, centre d'intérêt) */
  function replyTo(text) {
    const R = C.replies;
    const interest = p.interests.find(x => text.toLowerCase().includes(x.toLowerCase()));
    const pool = interest ? R.interest : text.includes("?") ? R.question : R.general;
    const reply = pool[Math.floor(Math.random() * pool.length)];
    if (!CH.presence(p.id).online) CH_DATA.chat.presence[p.id] = 0; // la personne se connecte pour répondre
    later(() => setTyping(true), 900);
    later(() => { CH.postMessage(p.id, "them", reply); setTyping(false); renderSide(); }, 2400 + Math.min(reply.length * 18, 1800));
  }

  function bindThread() {
    const form = document.getElementById("composer");
    const input = document.getElementById("composer-input");
    const send = document.getElementById("composer-send");
    const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; send.disabled = !input.value.trim(); };
    input.addEventListener("input", grow);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      if (!Store.read().chatCharter) return openModal("modal-charter");
      CH.postMessage(p.id, "me", text);
      input.value = "";
      grow();
      document.getElementById("starters").hidden = true;
      document.getElementById("btn-ideas").setAttribute("aria-expanded", "false");
      renderMessages();
      renderSide();
      if (!Remote.on) replyTo(text);   // démo : réponse simulée
    });

    const ideas = document.getElementById("btn-ideas");
    ideas.addEventListener("click", () => {
      const box = document.getElementById("starters");
      box.hidden = !box.hidden;
      ideas.setAttribute("aria-expanded", String(!box.hidden));
    });
    document.querySelectorAll("#starters .prompt").forEach(b => b.addEventListener("click", () => {
      input.value = b.textContent;
      grow();
      input.focus();
    }));

    /* Réactions : un menu par message, une réaction par personne */
    document.getElementById("messages").addEventListener("click", e => {
      const toggle = e.target.closest("[data-react-toggle]");
      const pick = e.target.closest("[data-react]");
      if (toggle) {
        const menu = document.querySelector(`[data-menu="${toggle.dataset.reactToggle}"]`);
        const open = menu.hidden;
        document.querySelectorAll(".react-menu").forEach(m => (m.hidden = true));
        menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        if (open) menu.querySelector("button").focus();
      }
      if (pick) {
        const i = Number(pick.dataset.react), key = pick.dataset.key;
        let msg = null;
        Store.update(st => { msg = st.messages[p.id][i]; msg.react = msg.react === key ? undefined : key; });
        if (msg?.id) Remote.push(() => Api.chat.react(msg.id, msg.react || null));
        renderMessages();
      }
    });

    bindReport({ getMember: () => p, context: "Messagerie", onBlock: block });
    document.querySelectorAll('[data-act="block"]').forEach(b => b.addEventListener("click", () => {
      document.getElementById("block-name").textContent = p.firstName;
      openModal("modal-block");
    }));
  }

  function block() {
    Store.update(st => { if (!st.blocked.includes(p.id)) st.blocked.push(p.id); });
    Remote.push(() => Api.chat.block(p.id));
    toast(`${p.firstName} a été bloqué(e).`);
    location.href = "#/messages";
  }

  /* ---------- Nouvelle conversation ---------- */
  function renderPicker() {
    const s = Store.read();
    const q = document.getElementById("new-search").value.toLowerCase();
    const list = CH.chatMembers(s).filter(m => {
      const c = CH.church(m.churchId);
      return `${m.firstName} ${m.city} ${c.name}`.toLowerCase().includes(q);
    });
    document.getElementById("new-list").innerHTML = list.length ? list.map(m => `
      <li><a href="#/messages?id=${m.id}">${avatarWithDot(m)}
        <span><strong>${CH.escape(m.firstName)}, ${m.age} ans</strong><span class="small muted">${CH.escape(m.city)} · ${CH.church(m.churchId).name}</span></span>
        <span class="small ${CH.presence(m.id).online ? "thread__online" : "muted"}">${CH.presence(m.id).label}</span></a></li>`).join("")
      : `<li class="small muted" style="padding:12px">Aucun membre ne correspond.</li>`;
  }

  /* ---------- Événements ---------- */
  document.getElementById("btn-new").addEventListener("click", () => { renderPicker(); openModal("modal-new"); document.getElementById("new-search").focus(); });
  document.getElementById("new-search").addEventListener("input", renderPicker);
  document.getElementById("conv-search").addEventListener("input", e => { query = e.target.value; renderSide(); });
  document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    renderSide();
  }));
  root.addEventListener("click", e => {
    const hello = e.target.closest("[data-hello]");
    if (hello) location.href = `#/messages?id=${hello.dataset.hello}`;
    const un = e.target.closest("[data-unblock]");
    if (un) {
      const target = un.dataset.unblock;
      Store.update(st => { st.blocked = st.blocked.filter(x => x !== target); });
      Remote.push(() => Api.chat.unblock(target));
      toast("Membre débloqué.");
      renderSide();
    }
  });
  App.onDocument("click", e => {
    if (!e.target.closest(".bubble")) document.querySelectorAll(".react-menu").forEach(m => (m.hidden = true));
  });

  document.getElementById("block-confirm").addEventListener("click", () => { closeModal("modal-block"); block(); });


  const charterOk = document.getElementById("charter-ok");
  const charterAccept = document.getElementById("charter-accept");
  charterOk.addEventListener("change", () => (charterAccept.disabled = !charterOk.checked));
  charterAccept.addEventListener("click", () => {
    Store.update(st => { st.chatCharter = true; });
    Remote.push(() => Api.account.acceptCharter());
    closeModal("modal-charter");
    toast("Merci ! Belle conversation.");
    document.getElementById("composer-input")?.focus();
  });

  /* Mode supabase : nouveaux messages reçus lors du rechargement régulier de l'état */
  if (Remote.on) document.addEventListener("cheminant:remote", () => {
    const count = p ? (Store.read().messages[p.id] || []).length : 0;
    if (p && count !== shown && document.getElementById("messages")) renderMessages();
    renderSide();
  }, { signal: ctx.signal });

  /* Démo : un membre écrit spontanément une fois, pour montrer la vie de la messagerie */
  if (!Remote.on && !s0.chatPing) later(() => {
    const from = CH.profile("p6");
    if (!CH.chatEligible(from) || Store.read().blocked.includes(from.id)) return;
    Store.update(st => { st.chatPing = true; });
    CH.postMessage(from.id, "them", `Bonjour ${s0.user.firstName} ! Je vois que nous avons plusieurs points communs dans le service. Belle journée à vous, au plaisir d'échanger.`);
    if (p && p.id === from.id) renderMessages();
    else toast(`Nouveau message de ${from.firstName}`);
    renderSide();
  }, 15000);

  if (p) {
    renderThread(); // marque le fil comme lu avant de dessiner la liste
    renderSide();
    if (!s0.chatCharter) openModal("modal-charter");
    else if (matchMedia("(min-width: 900px)").matches) later(() => document.getElementById("composer-input")?.focus(), 0);
  } else {
    renderSide();
    renderWelcome();
  }
  }
});
