/* Vue « Mon profil » — #/mon-profil */
/* Mon profil : informations, préférences, données */
App.view("mon-profil", {
  layout: "app",
  title: "Mon profil",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Mon compte</span>
      <h1>Mon profil</h1>
    </div>

    <div class="dash-grid">
      <div class="stack" style="gap:24px">
        <section class="card" id="parcours-cheminant" hidden></section>
        <section class="card" id="mes-photos">
          <h2 style="font-size:1.3rem">Mes photos</h2>
          <div id="photo-manager"></div>
        </section>
        <form class="card" id="profile-form">
          <div class="flex" style="margin-bottom:20px" id="identity"></div>
          <div class="field-row">
            <div class="field"><label for="p-first">Prénom</label><input class="input" id="p-first" required></div>
            <div class="field"><label for="p-city">Ville</label><input class="input" id="p-city" required></div>
          </div>
          <div class="field"><label for="p-job">Profession</label><input class="input" id="p-job"></div>
          <div class="field"><label for="p-quote">Ma phrase</label><input class="input" id="p-quote" maxlength="90" placeholder="Un verset, une conviction…"><span class="hint">Affichée en tête de votre profil (90 caractères maximum).</span></div>
          <div class="field"><label for="p-about">À propos de moi</label><textarea class="textarea" id="p-about"></textarea></div>
          <div class="alert" style="margin-bottom:20px"><i data-icon="info"></i><p>Votre prénom, votre âge et votre église ont été vérifiés par votre référent. Pour les modifier, adressez-vous à lui.</p></div>
          <button class="btn btn--primary">Enregistrer</button>
        </form>

        <section class="card">
          <h2 style="font-size:1.3rem">Préférences</h2>
          <label class="switch">
            <span><strong>Recevoir des suggestions</strong><br><span class="small muted">Des profils vous sont proposés à partir de vos réponses. Désactivé, vous gardez l'accès à la recherche classique. <a href="#/transparence">En savoir plus</a></span></span>
            <input type="checkbox" id="s-suggestions">
          </label>
          <label class="switch">
            <span><strong>Mettre mon profil en pause</strong><br><span class="small muted">Votre profil n'apparaît plus dans les recherches. Vos mises en relation en cours sont conservées.</span></span>
            <input type="checkbox" id="s-paused">
          </label>
        </section>

        <section class="card">
          <h2 style="font-size:1.3rem">Mes données</h2>
          <p class="small muted">Vous pouvez à tout moment demander l'accès à vos données, leur rectification ou leur suppression.</p>
          <div class="flex">
            <button class="btn btn--ghost btn--sm" data-act="export">Télécharger mes données</button>
            <button class="btn btn--danger btn--sm" data-act="delete">Demander la suppression de mon compte</button>
          </div>
        </section>
      </div>

      <aside class="stack" style="gap:24px">
        <section class="card" id="status"></section>
        <section class="card" id="referent"></section>
      </aside>
    </div>
  </div>

<!-- Modale : activer le parcours Cheminant -->
<div class="modal" id="modal-start" role="dialog" aria-modal="true" aria-labelledby="start-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="start-title" style="font-size:1.5rem">Activer le parcours Cheminant</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">Après ces trois mois d'échange, vous confirmez vouloir avancer avec <strong id="start-name"></strong>. Le parcours s'ouvrira quand vous l'aurez activé tous les deux : vous passerez alors du statut de <strong>candidats</strong> à celui de <strong>couple en cheminement</strong>, avec l'École du mariage.</p>
    <label class="check"><input type="checkbox" id="start-pray"><span>J'ai pris le temps de prier et de discerner cette décision.</span></label>
    <label class="check"><input type="checkbox" id="start-ref" checked disabled><span>Mon référent sera informé de cette étape.</span></label>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Pas encore</button>
      <button class="btn btn--primary" id="start-confirm" disabled>Activer le parcours</button>
    </div>
  </div>
</div>

<!-- Modale : suppression -->
<div class="modal" id="modal-delete" role="dialog" aria-modal="true" aria-labelledby="del-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="del-title" style="font-size:1.5rem">Supprimer mon compte ?</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted">Votre profil sera retiré de Cheminant et vos mises en relation seront closes. Votre référent en sera informé. Cette demande est traitée sous 30 jours.</p>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Annuler</button>
      <button class="btn btn--danger" id="del-confirm">Confirmer la demande</button>
    </div>
  </div>
</div>
`,
  init(ctx) {
  const $ = id => document.getElementById(id);
  const s = Store.read();
  const u = s.user;
  const church = CH.church(u.churchId);

  $("identity").innerHTML = `${CH.avatar(`${u.firstName} ${u.lastName}`, u.colors, "lg", u.photo)}
    <div><strong style="font-size:1.2rem">${CH.escape(u.firstName)} ${CH.escape(u.lastName)}</strong><br>
    <span class="small muted">${u.age} ans · ${CH.escape(church.name)}</span></div>`;
  /* Photos : envoyées tout de suite (démo : gardées dans l'état local) */
  const photos = { photo: u.photo || null, photos: (u.photos || []).slice() };
  const refreshIdentity = () => {
    const av = $("identity").querySelector(".avatar");
    if (av) av.outerHTML = CH.avatar(`${u.firstName} ${u.lastName}`, u.colors, "lg", photos.photo);
    const chip = document.querySelector(".user-chip .avatar");   // en-tête
    if (chip) chip.outerHTML = CH.avatar(`${u.firstName} ${u.lastName}`, u.colors, "sm", photos.photo);
  };
  mountPhotoManager($("photo-manager"), Object.assign(photos, {
    async onMain(image) {
      const res = await Api.account.setPhoto(image);
      photos.photo = res.photo;
      if (Remote.on) await Remote.refresh();
      refreshIdentity();
      toast("Photo de profil enregistrée.");
    },
    async onAdd(image) {
      const res = await Api.account.addPhoto(image);
      photos.photos.push(res.photo);
      if (Remote.on) await Remote.refresh();
      toast("Photo ajoutée.");
    },
    async onRemove(index) {
      await Api.account.removePhoto(index);
      photos.photos.splice(index, 1);
      if (Remote.on) await Remote.refresh();
      toast("Photo retirée.");
    }
  }));

  $("p-first").value = u.firstName;
  $("p-first").readOnly = true;
  $("p-city").value = u.city;
  $("p-job").value = u.job || "";
  $("p-quote").value = u.quote || "";
  $("p-about").value = u.about || "";

  $("profile-form").addEventListener("submit", e => {
    e.preventDefault();
    let patch = null;
    Store.update(st => {
      st.user.city = CH.clean($("p-city").value, 80);
      st.user.job = CH.clean($("p-job").value, 80);
      st.user.quote = $("p-quote").value.trim().slice(0, 280);
      st.user.about = $("p-about").value.trim().slice(0, 2000);
      patch = { city: st.user.city, job: st.user.job, quote: st.user.quote, about: st.user.about };
    });
    Remote.push(() => Api.account.updateProfile(patch));
    toast("Profil enregistré.");
  });

  /* Préférences */
  $("s-suggestions").checked = s.settings.suggestions;
  $("s-paused").checked = s.settings.paused;
  ["suggestions", "paused"].forEach(key => {
    $("s-" + key).addEventListener("change", e => {
      Store.update(st => { st.settings[key] = e.target.checked; });
      Remote.push(() => Api.account.settings({ [key]: e.target.checked }));
      const msg = key === "suggestions"
        ? (e.target.checked ? "Suggestions activées." : "Suggestions désactivées. La recherche reste disponible.")
        : (e.target.checked ? "Profil mis en pause." : "Profil de nouveau visible.");
      toast(msg);
      renderStatus();
    });
  });

  /* Parcours Cheminant : activable par chacun après 3 mois d'échange */
  function renderCheminant() {
    const st0 = Store.read();
    const id = CH.relationId(st0);
    const box = $("parcours-cheminant");
    box.hidden = !id;
    if (!id) return;
    const p = CH.profile(id);
    const st = CH.cheminantStatus(st0, id);
    let action;
    if (st.active) action = `<a class="btn btn--primary" href="#/ecole">${icon("book", 18)} École du mariage</a>`;
    else if (!st.unlocked) action = `<button class="btn btn--primary" disabled>${icon("lock", 18)} Activable dans ${st.left} jour${st.left > 1 ? "s" : ""}</button>`;
    else if (st.me) action = `<p class="alert alert--gold mb-0">${icon("clock")}<span>Votre activation est enregistrée. Le parcours s'ouvrira dès que ${CH.escape(p.firstName)} l'aura activé à son tour.</span></p>`;
    else action = `<button class="btn btn--primary" id="btn-start">${icon("ring", 18)} Activer le parcours Cheminant</button>`;
    box.innerHTML = `
      <div class="flex" style="margin-bottom:16px">
        <div class="couple-banner__avatars">${CH.avatar(st0.user.firstName, st0.user.colors, "sm", st0.user.photo)}${CH.avatar(p.firstName, p.colors, "sm", p.photo)}</div>
        <div><h2 style="font-size:1.3rem;margin:0">Parcours Cheminant</h2><span class="small muted">Avec ${CH.escape(p.firstName)} · <a href="#/cheminement?id=${p.id}">Notre cheminement</a></span></div>
      </div>
      ${st.active
        ? `<p class="muted">Vous êtes un couple en cheminement. L'École du mariage vous est ouverte.</p>`
        : `<p class="small muted">Trois mois d'échange sur Cheminant permettent d'apprendre à se connaître et d'éprouver la relation. Ensuite, chacun active le parcours depuis son profil ; il s'ouvre quand vous l'avez activé tous les deux.</p>${cheminantGate(p, st)}`}
      <div style="margin-top:16px">${action}</div>`;
    $("btn-start")?.addEventListener("click", () => {
      $("start-name").textContent = p.firstName;
      openModal("modal-start");
    });
    $("start-confirm").onclick = () => {
      const res = CH.activateCheminant(id);
      closeModal("modal-start");
      toast(res === "active" ? "Vous êtes désormais un couple en cheminement !" : `Activation enregistrée. Le parcours s'ouvrira quand ${p.firstName} l'aura activé.`);
      renderCheminant();
      renderStatus();
    };
  }
  $("start-pray").addEventListener("change", e => ($("start-confirm").disabled = !e.target.checked));
  renderCheminant();

  /* Statut et référent */
  function renderStatus() {
    const st = Store.read();
    const active = st.user.status === "actif";
    $("status").innerHTML = `
      <h2 style="font-size:1.2rem">Statut</h2>
      <p class="mb-0">${active
        ? `<span class="badge badge--sage">${icon("shield", 13)} Profil validé</span>`
        : `<span class="badge badge--amber">${icon("clock", 13)} En attente de validation</span>`}
      ${st.settings.paused ? `<span class="badge">En pause</span>` : ""}
      ${st.coupleWith ? `<span class="badge badge--primary">Couple en cheminement</span>` : ""}</p>
      ${!active ? "" : CH.memberPaid(st)
        ? `<div class="pay-mini"><span class="small muted">Formule</span><strong>${CH_DATA.plans[st.user.plan || "single"].name}</strong>
             ${st.user.paidUntil ? `<span class="small muted">Active jusqu'au ${new Date(st.user.paidUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>` : `<span class="small muted">Active</span>`}
             <a class="small" href="#/paiement">Gérer ma formule</a></div>`
        : `<div class="alert alert--amber" style="margin-top:12px">${icon("info")}<p class="small">Votre profil deviendra définitif et visible des autres membres après le règlement de votre formule.</p></div>
           <a class="btn btn--primary btn--block" style="margin-top:12px" href="#/paiement">Régler ma formule</a>`}`;
  }
  renderStatus();

  $("referent").innerHTML = `
    <h2 style="font-size:1.2rem">Mon référent</h2>
    <div class="flex" style="margin-bottom:12px">
      <span class="card__icon card__icon--gold" style="margin:0">${icon("church")}</span>
      <div><strong>${CH.escape(church.referent)}</strong><br><span class="small muted">${CH.escape(church.name)} · ${CH.escape(church.city)}</span></div>
    </div>
    <p class="small muted">Votre référent peut vous accompagner à chaque étape. Vos conversations restent privées.</p>
    <button class="btn btn--ghost btn--sm btn--block" data-act="contact">${icon("chat", 15)} Demander un échange</button>`;

  App.onDocument("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.dataset.act === "export") {
      if (!Remote.on) return toast("Votre export sera envoyé par e-mail (démo).");
      /* Export RGPD : fichier JSON des données du compte, téléchargé par le navigateur */
      Api.account.exportData().then(data => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: "cheminant-mes-donnees.json" });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }).catch(err => toast(err.message));
    }
    if (b.dataset.act === "contact") {
      Remote.push(() => Api.profiles.requestAccompaniment(null));
      toast(`Demande transmise à ${church.referent}.`);
    }
    if (b.dataset.act === "delete") openModal("modal-delete");
  });
  $("del-confirm").addEventListener("click", () => {
    closeModal("modal-delete");
    Remote.push(() => Api.account.requestDeletion());
    toast(Remote.on ? "Demande de suppression enregistrée. Elle sera traitée sous 30 jours." : "Demande de suppression enregistrée (démo).");
  });
  }
});
