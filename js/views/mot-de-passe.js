/* Vue « Mot de passe » — #/mot-de-passe
   Ouverte depuis le lien reçu par e-mail : invitation d'un référent ou d'une église,
   ou mot de passe oublié. La session est déjà ouverte par ce lien (Supabase Auth). */
App.view("mot-de-passe", {
  layout: "public",
  title: "Choisir mon mot de passe",
  mainClass: "auth",
  template: () => `
  <aside class="auth__aside">
    <span class="eyebrow">Bienvenue</span>
    <h2>« Que tout se fasse avec bienséance et avec ordre. »</h2>
    <p style="color:var(--color-night-muted)">1 Corinthiens 14.40</p>
  </aside>
  <div class="auth__main">
    <div class="auth__panel" style="max-width:440px">
      <h1 style="font-size:2rem">Choisir mon mot de passe</h1>
      <p class="muted" id="pw-intro">Ce mot de passe vous permettra d'accéder à votre espace Cheminant.</p>
      <form id="pw-form" novalidate>
        <div class="field"><label for="pw-new">Nouveau mot de passe</label><input class="input" type="password" id="pw-new" minlength="8" required autocomplete="new-password"><span class="hint">8 caractères minimum.</span></div>
        <div class="field"><label for="pw-confirm">Confirmer le mot de passe</label><input class="input" type="password" id="pw-confirm" minlength="8" required autocomplete="new-password"></div>
        <p class="small" id="pw-error" role="alert" style="color:var(--color-danger);min-height:1.4em;margin:0 0 8px"></p>
        <button class="btn btn--primary btn--block" type="submit" id="pw-submit">Enregistrer et accéder à mon espace</button>
      </form>
    </div>
  </div>`,
  init() {
    const $ = id => document.getElementById(id);
    if (!Remote.on || !Remote.role) {
      $("pw-intro").textContent = "Ce lien n'est plus valide. Demandez un nouveau lien depuis la page de connexion (« Mot de passe oublié ? »).";
      $("pw-form").hidden = true;
      return;
    }
    $("pw-form").addEventListener("submit", async e => {
      e.preventDefault();
      const pw = $("pw-new").value, confirm = $("pw-confirm").value;
      if (pw.length < 8) { $("pw-error").textContent = "Le mot de passe doit contenir au moins 8 caractères."; return $("pw-new").focus(); }
      if (pw !== confirm) { $("pw-error").textContent = "Les deux mots de passe ne correspondent pas."; return $("pw-confirm").focus(); }
      const btn = $("pw-submit");
      btn.disabled = true;
      try {
        await Api.auth.updatePassword(pw);
        await Remote.refresh();
        toast("Mot de passe enregistré.");
        location.href = Remote.home();
      } catch (err) {
        $("pw-error").textContent = err.message;
        btn.disabled = false;
      }
    });
  }
});
