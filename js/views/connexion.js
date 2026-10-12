/* Vue « Connexion » — #/connexion */
App.view("connexion", {
  layout: "public",
  title: "Connexion",
  mainClass: "auth",
  template: () => `
  <aside class="auth__aside">
    <span class="eyebrow">Bon retour</span>
    <h2>« L'amour est patient, il est plein de bonté. »</h2>
    <p style="color:var(--color-night-muted)">1 Corinthiens 13.4</p>
  </aside>
  <div class="auth__main">
    <div class="auth__panel" style="max-width:440px">
      <h1 style="font-size:2rem">Se connecter</h1>
      <p class="muted">Retrouvez votre espace et votre cheminement.</p>
      <p class="alert alert--amber small" id="login-notice" role="alert" hidden></p>
      <form id="login">
        <div class="field"><label for="email">Adresse e-mail</label><input class="input" type="email" id="email" autocomplete="email" required></div>
        <div class="field"><label for="password">Mot de passe</label><input class="input" type="password" id="password" autocomplete="current-password" required></div>
        <p class="small" id="login-error" role="alert" style="color:var(--color-danger);min-height:1.4em;margin:0 0 8px"></p>
        <button class="btn btn--primary btn--block" type="submit" id="login-submit">Se connecter</button>
      </form>
      <p class="small muted" style="margin-top:16px">
        <button type="button" class="link-btn" id="forgot">Mot de passe oublié ?</button><br>
        Pas encore de compte ? <a href="#/inscription">Inscrivez-vous</a>
      </p>

      ${Remote.on ? "" : `<div class="card card--soft" style="margin-top:32px">
        <h3 style="font-size:1.05rem">Accès rapide à la démo</h3>
        <p class="small muted">Prototype frontend : choisissez un rôle pour explorer l'interface.</p>
        <div class="stack">
          <button class="btn btn--ghost btn--block" data-demo="actif">Membre, profil activé</button>
          <button class="btn btn--ghost btn--block" data-demo="troismois">Mise en relation de trois mois</button>
          <button class="btn btn--ghost btn--block" data-demo="impaye">Membre validé, formule à régler</button>
          <button class="btn btn--ghost btn--block" data-demo="attente">Membre en attente de validation</button>
          <button class="btn btn--ghost btn--block" data-demo="couple">Couple en cheminement</button>
          <button class="btn btn--ghost btn--block" data-demo="preparation">Couple en préparation au mariage</button>
          <button class="btn btn--ghost btn--block" data-demo="referent">Référent d'église</button>
          <button class="btn btn--ghost btn--block" data-demo="eglise">Église partenaire (reversements)</button>
          <button class="btn btn--ghost btn--block" data-demo="admin">Administrateur Cheminant</button>
        </div>
      </div>`}
    </div>
  </div>
`,
  init(ctx) {
  const $ = id => document.getElementById(id);
  const notice = $("login-notice");
  const error = $("login-error");
  /* Retour d'un lien expiré ou déjà utilisé */
  if (ctx.param("erreur") === "lien") {
    notice.textContent = "Ce lien a déjà été utilisé ou a expiré. Si vous avez déjà confirmé votre adresse e-mail, connectez-vous simplement ci-dessous. Sinon, demandez un nouveau lien avec « Mot de passe oublié ? ».";
    notice.hidden = false;
  }
  /* Page demandée avant la connexion : seulement une vue connue de l'application */
  const next = () => {
    const suite = ctx.param("suite") || "";
    const name = App.parse("#" + suite).name;
    return suite.startsWith("/") && App.views[name] && name !== "connexion" && Remote.allows(App.views[name].layout) ? "#" + suite : Remote.home();
  };

  $("login").addEventListener("submit", async e => {
    e.preventDefault();
    if (!Remote.on) { location.href = "#/tableau-de-bord"; return; }
    const btn = $("login-submit");
    error.textContent = "";
    btn.disabled = true;
    btn.textContent = "Connexion…";
    try {
      await Api.auth.login($("email").value.trim(), $("password").value);
      await Remote.refresh();
      await Remote.completeRegistration();
      location.href = next();
    } catch (err) {
      error.textContent = err.message;
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  });

  $("forgot").addEventListener("click", async () => {
    const email = $("email");
    if (!email.value.trim() || !email.checkValidity()) {
      error.textContent = "Indiquez votre adresse e-mail, puis cliquez de nouveau sur « Mot de passe oublié ? ».";
      return email.focus();
    }
    try {
      await Api.auth.resetPassword(email.value.trim());
      error.textContent = "";
      notice.textContent = "Si un compte existe avec cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe.";
      notice.hidden = false;
    } catch (err) {
      error.textContent = err.message;
    }
  });
  document.querySelectorAll("[data-demo]").forEach(btn => btn.addEventListener("click", () => {
    const mode = btn.dataset.demo;
    if (mode === "admin") return (location.href = "#/admin");
    if (mode === "eglise") return (location.href = "#/eglise");
    if (mode === "referent") return (location.href = "#/referent"); // garde l'état : permet de valider le membre de la démo
    Store.resetMember();
    /* Démo : relation de plus de 3 mois, Rebecca a déjà activé le parcours de son côté */
    const past = days => new Date(Date.now() - days * 86400000).toISOString();
    if (mode === "troismois") Store.update(s => { s.relationSince.p1 = past(95); s.cheminantConsent.p1 = { them: past(1) }; });
    if (["couple", "preparation"].includes(mode)) Store.update(s => { s.relationSince.p1 = past(200); s.cheminantConsent.p1 = { me: past(100), them: past(100) }; });
    /* Démo : cours vidéo et audio déjà suivis par chacun des conjoints */
    const all = n => [...Array(n).keys()];
    if (mode === "couple") Store.update(s => {
      s.courses = { me: { 1: all(6), 2: all(8), 3: [0, 1, 2] }, partner: { 1: all(6), 2: all(5) }, lastAt: { me: past(1), partner: past(3) } };
    });
    if (mode === "preparation") Store.update(s => {
      const full = Object.fromEntries(CH_DATA.modules.map(m => [m.id, all(CH_DATA.courses[m.id].length)]));
      s.courses = { me: full, partner: full, lastAt: { me: past(4), partner: past(4) } };
    });
    if (mode === "impaye") Store.update(s => { s.user.paid = false; });
    if (mode === "attente") Store.update(s => { s.user.status = "en_attente_validation"; s.interests = {}; s.messages = {}; s.candidates.k1 = { interview: "a_planifier", decision: null }; });
    if (mode === "couple") Store.update(s => { s.interests.p1 = "couple"; s.coupleWith = "p1"; s.modules = { 1: [0,1,2,3,4,5], 2: [0,1,2,3,4,5], 3: [0,1,2,3,4,5], 4: [0,1] }; });
    if (mode === "preparation") Store.update(s => {
      s.interests.p1 = "couple"; s.coupleWith = "p1";
      s.modules = Object.fromEntries(CH_DATA.modules.map(m => [m.id, [0, 1, 2, 3, 4, 5]]));
      s.prep.sessions = [0, 1, 2];
    });
    location.href = { couple: "#/ecole", preparation: "#/preparation", impaye: "#/paiement", troismois: "#/mon-profil/parcours-cheminant" }[mode] || "#/tableau-de-bord";
  }));
  }
});
