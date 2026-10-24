/* Vue « Inscription » — #/inscription */
/* Inscription en 5 étapes */
App.view("inscription", {
  layout: "public",
  title: "Inscription",
  mainClass: "auth",
  template: () => `
  <aside class="auth__aside">
    <span class="eyebrow">Inscription</span>
    <h2>Votre cheminement commence par une démarche sincère</h2>
    <p style="color:var(--color-night-muted)">Après votre inscription, un référent de votre église vous contactera pour un entretien. Votre profil sera activé après sa validation.</p>
    <ul class="checks" style="color:var(--color-night-text)">
      <li><span>Profil visible uniquement par des membres validés</span></li>
      <li><span>Messagerie réservée aux membres validés</span></li>
      <li><span>Accompagnement par votre communauté</span></li>
    </ul>
  </aside>

  <div class="auth__main">
    <div class="auth__panel">
      <div class="stepper" id="stepper" aria-hidden="true"></div>

      <form id="signup" novalidate>
        <!-- Étape 1 : compte -->
        <section class="form-step is-active" data-step="Compte">
          <h1 style="font-size:2rem" id="account-title">Créer votre compte</h1>
          <p class="muted" id="account-intro">Quelques informations pour commencer.</p>
          <div id="account-google">${googleButton()}</div>
          <div class="field-row">
            <div class="field"><label for="firstName">Prénom</label><input class="input" id="firstName" name="firstName" required maxlength="60" autocomplete="given-name"></div>
            <div class="field"><label for="lastName">Nom</label><input class="input" id="lastName" name="lastName" required maxlength="60" autocomplete="family-name"></div>
          </div>
          <div id="account-credentials">
            <div class="field"><label for="email">Adresse e-mail</label><input class="input" type="email" id="email" name="email" required autocomplete="email"></div>
            <div class="field"><label for="password">Mot de passe</label><input class="input" type="password" id="password" name="password" required minlength="8" autocomplete="new-password"><span class="hint">8 caractères minimum.</span></div>
          </div>
        </section>

        <!-- Étape 2 : profil -->
        <section class="form-step" data-step="Profil">
          <h1 style="font-size:2rem">Votre profil</h1>
          <p class="muted">Ces informations seront visibles par les membres validés.</p>
          <fieldset class="field">
            <legend>Vous êtes</legend>
            <div class="choice-group">
              <label class="choice"><input type="radio" name="gender" value="M" required><span>Un homme</span></label>
              <label class="choice"><input type="radio" name="gender" value="F"><span>Une femme</span></label>
            </div>
          </fieldset>
          <div class="field-row">
            <div class="field"><label for="age">Âge</label><input class="input" type="number" id="age" name="age" min="18" max="99" required></div>
            <div class="field"><label for="city">Ville</label><input class="input" id="city" name="city" required autocomplete="address-level2"></div>
          </div>
          <div class="field"><label for="job">Profession</label><input class="input" id="job" name="job"></div>
          <fieldset class="field">
            <legend>Vos photos</legend>
            <div id="signup-photos"></div>
          </fieldset>
          <div class="field"><label for="about">Quelques mots sur vous</label><textarea class="textarea" id="about" name="about" placeholder="Votre foi, vos passions, ce qui compte pour vous…"></textarea></div>
        </section>

        <!-- Étape 3 : projet de vie -->
        <section class="form-step" data-step="Projet">
          <h1 style="font-size:2rem">Votre projet de vie</h1>
          <p class="muted">Vos réponses nous aident à identifier des points de convergence. <a href="#/transparence" target="_blank" rel="noopener">Comment sont-elles utilisées ?</a></p>
          <fieldset class="field">
            <legend>Place de la foi dans votre quotidien</legend>
            <div class="choice-group">
              <label class="choice"><input type="radio" name="faith" value="centrale" required><span>Centrale</span></label>
              <label class="choice"><input type="radio" name="faith" value="importante"><span>Importante</span></label>
              <label class="choice"><input type="radio" name="faith" value="cheminement"><span>En cheminement</span></label>
            </div>
          </fieldset>
          <fieldset class="field">
            <legend>Désir d'enfants</legend>
            <div class="choice-group">
              <label class="choice"><input type="radio" name="children" value="oui" required><span>Oui</span></label>
              <label class="choice"><input type="radio" name="children" value="ouvert"><span>Ouvert(e)</span></label>
              <label class="choice"><input type="radio" name="children" value="non"><span>Non</span></label>
            </div>
          </fieldset>
          <fieldset class="field">
            <legend>Mobilité géographique</legend>
            <div class="choice-group">
              <label class="choice"><input type="radio" name="mobility" value="locale" required><span>Je reste dans ma région</span></label>
              <label class="choice"><input type="radio" name="mobility" value="france"><span>Mobile en France</span></label>
              <label class="choice"><input type="radio" name="mobility" value="monde"><span>Ouvert(e) à l'international</span></label>
            </div>
          </fieldset>
          <fieldset class="field">
            <legend>Ce qui compte le plus pour vous dans un couple <span class="hint">(3 maximum)</span></legend>
            <div class="choice-group" id="values">
              <label class="choice"><input type="checkbox" name="values" value="priere"><span>Prier ensemble</span></label>
              <label class="choice"><input type="checkbox" name="values" value="communication"><span>Communication</span></label>
              <label class="choice"><input type="checkbox" name="values" value="service"><span>Servir ensemble</span></label>
              <label class="choice"><input type="checkbox" name="values" value="famille"><span>Famille</span></label>
              <label class="choice"><input type="checkbox" name="values" value="fidelite"><span>Fidélité</span></label>
              <label class="choice"><input type="checkbox" name="values" value="humour"><span>Humour</span></label>
              <label class="choice"><input type="checkbox" name="values" value="ambition"><span>Projets communs</span></label>
            </div>
          </fieldset>
        </section>

        <!-- Étape 4 : église -->
        <section class="form-step" data-step="Église">
          <h1 style="font-size:2rem">Rattachement à votre église</h1>
          <p class="muted">Choisissez l'église à laquelle vous appartenez. Son référent recevra votre demande de validation.</p>
          <div class="field">
            <label for="church-search">Rechercher une église ou une ville</label>
            <input class="input" id="church-search" type="search" placeholder="Ex. Lyon, Saint-Jean…">
          </div>
          <div class="church-list" id="church-list" role="radiogroup" aria-label="Églises partenaires"></div>
          <p class="small muted" style="margin-top:12px">Votre église n'apparaît pas ? <button type="button" class="link-btn" id="suggest-church">Signalez-la-nous</button>, nous la contacterons.</p>
          <div class="field"><label for="since">Membre depuis</label><select class="select" id="since" name="since"><option>Moins d'un an</option><option>1 à 3 ans</option><option selected>Plus de 3 ans</option></select></div>
        </section>

        <!-- Étape 5 : engagements -->
        <section class="form-step" data-step="Engagement">
          <h1 style="font-size:2rem">Vos engagements</h1>
          <p class="muted">Avant d'envoyer votre demande au référent.</p>
          <div class="card card--soft" style="margin-bottom:20px" id="recap"></div>
          <fieldset class="field">
            <legend>Votre formule</legend>
            <div class="plan-options" id="plan-options"></div>
            <p class="hint">Le paiement n'intervient qu'après la validation de votre candidature par votre référent.</p>
          </fieldset>
          <label class="check"><input type="checkbox" required name="charter"><span>J'adhère à la <strong>charte Cheminons</strong> : démarche sincère, respect, discrétion et relation orientée vers le mariage.</span></label>
          <label class="check"><input type="checkbox" required name="referent"><span>J'accepte que mon référent d'église soit informé de ma démarche et puisse me contacter pour un entretien.</span></label>
          <label class="check"><input type="checkbox" required name="sensitive"><span>J'accepte que Cheminons traite les informations liées à ma <strong>foi et à mon église</strong> (données sensibles) pour étudier ma candidature et me proposer des profils. Je peux retirer ce consentement en supprimant mon compte. <a href="#/confidentialite" target="_blank" rel="noopener">Politique de confidentialité</a>.</span></label>
          <label class="check"><input type="checkbox" required name="profiling"><span>J'ai pris connaissance du <a href="#/transparence" target="_blank" rel="noopener">fonctionnement de la compatibilité</a> : un score interne aide à proposer des profils, mais ne prend jamais seul de décision me concernant.</span></label>
        </section>

        <p class="small" id="form-error" role="alert" style="color:var(--color-danger);min-height:1.4em;margin:8px 0 0"></p>
        <div class="form-nav">
          <button type="button" class="btn btn--ghost" id="prev">Retour</button>
          <button type="submit" class="btn btn--primary" id="next">Continuer</button>
        </div>
      </form>

      <!-- Confirmation -->
      <section id="done" hidden>
        <div class="card__icon card__icon--sage" style="width:64px;height:64px"><i data-icon="send" data-size="28"></i></div>
        <h1 style="font-size:2rem" id="done-title">Demande envoyée à votre référent</h1>
        <p class="lead" id="done-text"></p>
        <ol class="journey" style="margin:24px 0">
          <li class="journey__step is-done"><span class="journey__dot"><i data-icon="check" data-size="14"></i></span><div><div class="journey__title">Inscription</div></div></li>
          <li class="journey__step is-done"><span class="journey__dot"><i data-icon="check" data-size="14"></i></span><div><div class="journey__title">Rattachement à une église</div></div></li>
          <li class="journey__step is-current"><span class="journey__dot">3</span><div><div class="journey__title">Validation du référent</div><div class="journey__desc">Entretien à planifier</div></div></li>
          <li class="journey__step"><span class="journey__dot">4</span><div><div class="journey__title">Profil activé</div></div></li>
        </ol>
        <a class="btn btn--primary" href="#/tableau-de-bord" id="done-link">Accéder à mon espace</a>
      </section>
    </div>
  </div>
`,
  init(ctx) {
  const form = document.getElementById("signup");
  /* Mode supabase : candidature déjà envoyée → espace du compte ;
     compte créé (adresse confirmée ou compte Google) mais candidature à compléter →
     l'étape « Compte » ne garde que le prénom et le nom, sans e-mail ni mot de passe */
  if (Remote.on && Remote.role && !Remote.needsProfile) { location.replace(Remote.home()); return; }
  const resuming = Remote.on && Remote.role === "membre" && Remote.needsProfile;
  const formule = Object.hasOwn(CH_DATA.plans, ctx.param("formule") || "") ? ctx.param("formule") : "";
  if (resuming) {
    const u = Store.read().user || {};
    document.getElementById("account-google").remove();
    document.getElementById("account-credentials").remove();
    document.getElementById("account-title").textContent = "Votre identité";
    document.getElementById("account-intro").textContent = Remote.email
      ? `Votre compte est ouvert avec l'adresse ${Remote.email}. Vérifiez votre prénom et votre nom : ils seront transmis au référent de votre église.`
      : "Vérifiez votre prénom et votre nom : ils seront transmis au référent de votre église.";
    const first = document.getElementById("firstName"), last = document.getElementById("lastName");
    first.value = CH.clean(u.firstName || "", 60);
    last.value = CH.clean(u.lastName || "", 60);
    /* Compte Google : prénom et nom proposés par Google, modifiables */
    if (!first.value || !last.value) Api.auth.providerNames().then(n => {
      if (!first.value) first.value = CH.clean(n.firstName, 60);
      if (!last.value) last.value = CH.clean(n.lastName, 60);
    }).catch(() => {});
  } else {
    bindGoogleButton(form, "/inscription" + (formule ? `?formule=${formule}` : ""));
  }
  const steps = [...form.querySelectorAll(".form-step")];
  const stepper = document.getElementById("stepper");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const error = document.getElementById("form-error");
  let current = 0;

  stepper.innerHTML = steps.map(s =>
    `<div class="stepper__item"><div class="stepper__bar"></div><div class="stepper__label">${s.dataset.step}</div></div>`).join("");

  function show(i) {
    current = i;
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    [...stepper.children].forEach((el, k) => {
      el.classList.toggle("is-done", k < i);
      el.classList.toggle("is-current", k === i);
    });
    prev.style.visibility = i === 0 ? "hidden" : "visible";
    next.textContent = i === steps.length - 1 ? "Envoyer ma demande au référent" : "Continuer";
    error.textContent = "";
    if (i === steps.length - 1) { renderRecap(); renderPlans(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validStep(i) {
    const fields = [...steps[i].querySelectorAll("input, select, textarea")];
    for (const f of fields) {
      if (!f.checkValidity()) {
        f.focus();
        const label = f.closest(".field, fieldset, .check")?.querySelector("label, legend, span")?.textContent.trim();
        error.textContent = f.type === "checkbox" ? "Merci d'accepter les engagements pour continuer." : `Champ à compléter : ${label || "information manquante"}.`;
        return false;
      }
    }
    if (steps[i].dataset.step === "Profil" && !photos.photo) {
      error.textContent = "Merci d'ajouter votre photo de profil : elle est exigée.";
      document.getElementById("signup-photos").scrollIntoView({ block: "center" });
      return false;
    }
    if (steps[i].dataset.step === "Église" && !form.querySelector('input[name="church"]:checked')) {
      error.textContent = "Merci de choisir votre église.";
      return false;
    }
    return true;
  }

  /* Photos : gardées en mémoire, envoyées avec la candidature */
  const photos = { photo: null, photos: [] };
  mountPhotoManager(document.getElementById("signup-photos"), Object.assign(photos, {
    async onMain(image) { photos.photo = image; error.textContent = ""; },
    async onRemoveMain() { photos.photo = null; },
    async onAdd(image) { if (photos.photos.length < PHOTO_MAX_EXTRA) photos.photos.push(image); },
    async onRemove(index) { photos.photos.splice(index, 1); }
  }));
  /* Liste des églises filtrable */
  const list = document.getElementById("church-list");
  function renderChurches(q = "") {
    const term = q.trim().toLowerCase();
    const items = CH.allChurches().filter(c => !term || `${c.name} ${c.city} ${c.denomination}`.toLowerCase().includes(term));
    list.innerHTML = items.length ? items.map(c => `
      <div class="church-option">
        <input type="radio" name="church" id="ch-${c.id}" value="${c.id}">
        <label for="ch-${c.id}">
          <span class="card__icon card__icon--gold" style="margin:0;width:42px;height:42px">${icon("church", 20)}</span>
          <span><strong>${CH.escape(c.name)}</strong><span class="small muted">${CH.escape(c.city)} · ${CH.escape(c.denomination)} · Référent : ${CH.escape(c.referent)}</span></span>
        </label>
      </div>`).join("") : `<p class="muted small">Aucune église trouvée.</p>`;
  }
  const search = document.getElementById("church-search");
  if (Remote.on) {
    list.innerHTML = `<p class="muted small">Chargement des églises partenaires…</p>`;
    Remote.churchesReady.then(() => { if (list.isConnected) renderChurches(search.value); });
  } else renderChurches();
  search.addEventListener("input", e => renderChurches(e.target.value));
  document.getElementById("suggest-church").addEventListener("click", e => {
    e.preventDefault();
    if (Remote.on) { window.open("#/eglise-partenaire", "_blank", "noopener"); return; }
    toast("Merci ! Nous contacterons votre église (démo).");
  });

  /* Valeurs : 3 maximum */
  document.getElementById("values").addEventListener("change", e => {
    const checked = form.querySelectorAll('input[name="values"]:checked');
    if (checked.length > 3) { e.target.checked = false; toast("3 choix maximum"); }
  });

  function renderRecap() {
    const d = new FormData(form);
    const church = CH.church(d.get("church"));
    document.getElementById("recap").innerHTML = `
      <div class="flex">
        ${CH.avatar(`${d.get("firstName")} ${d.get("lastName")}`, ["#3d7a5a", "#2f5f8a"], "", photos.photo)}
        <div><strong>${CH.escape(d.get("firstName"))} ${CH.escape(d.get("lastName"))}</strong><br>
        <span class="small muted">${CH.escape(d.get("age"))} ans · ${CH.escape(d.get("city"))}</span></div>
      </div>
      <p class="small mb-0" style="margin-top:14px">${icon("church", 16)} Rattachement : <strong>${CH.escape(church.name)}</strong><br>
      Votre demande sera transmise à <strong>${CH.escape(church.referent)}</strong>.</p>`;
  }

  /* Formules proposées selon la région de l'église choisie */
  function renderPlans() {
    const box = document.getElementById("plan-options");
    const region = CH.region(new FormData(form).get("church"));
    const chosen = form.querySelector('input[name="plan"]:checked')?.value || (formule || "single");
    const r = CH_DATA.pricing.find(x => x.region === region);
    box.innerHTML = Object.entries(r.plans).map(([key, p]) => `
      <div class="plan-option">
        <input type="radio" name="plan" id="plan-${key}" value="${key}" required ${key === chosen ? "checked" : ""}>
        <label for="plan-${key}">
          <span><strong>${CH_DATA.plans[key].name}</strong><span class="small muted">${CH_DATA.plans[key].audience}</span></span>
          <span class="plan-option__price">${CH.money(p.amount, r.currency)}<span class="small muted"> ${p.period}</span></span>
        </label>
      </div>`).join("");
  }

  prev.addEventListener("click", () => show(Math.max(0, current - 1)));

  /* Écran de fin : demande envoyée, ou lien de confirmation à ouvrir */
  function showDone(firstName, church, confirmEmail) {
    form.hidden = true;
    stepper.hidden = true;
    if (confirmEmail) {
      document.getElementById("done-title").textContent = "Confirmez votre adresse e-mail";
      document.getElementById("done-text").innerHTML =
        `Merci ${CH.escape(firstName)} ! Un lien de confirmation vient de vous être envoyé à <strong>${CH.escape(confirmEmail)}</strong>. Ouvrez-le sur cet appareil : votre demande sera alors transmise à <strong>${CH.escape(church.referent)}</strong> (${CH.escape(church.name)}).`;
      const link = document.getElementById("done-link");
      link.textContent = "J'ai confirmé mon adresse : me connecter";
      link.href = "#/connexion";
    } else {
      document.getElementById("done-text").innerHTML =
        `Merci ${CH.escape(firstName)} ! <strong>${CH.escape(church.referent)}</strong> (${CH.escape(church.name)}) va vous contacter pour planifier un entretien de validation.`;
    }
    document.getElementById("done").hidden = false;
    window.scrollTo({ top: 0 });
  }

  /* Mode supabase : compte Supabase Auth, puis candidature (POST /candidates) */
  async function submitRemote(d, church) {
    const payload = {
      firstName: CH.clean(d.get("firstName"), 60), lastName: CH.clean(d.get("lastName"), 60),
      gender: d.get("gender"), age: Number(d.get("age")), city: CH.clean(d.get("city"), 80),
      job: CH.clean(d.get("job"), 80), about: String(d.get("about") || "").trim().slice(0, 2000),
      answers: { faith: d.get("faith"), children: d.get("children"), mobility: d.get("mobility"), values: d.getAll("values") },
      churchId: church.id, since: d.get("since"), plan: d.get("plan"), sensitiveConsent: d.get("sensitive") === "on",
      photos: { main: photos.photo, extra: photos.photos.slice(0, PHOTO_MAX_EXTRA) }   // envoyées après la candidature
    };
    next.disabled = true;
    next.textContent = "Envoi en cours…";
    try {
      let signedIn = resuming;
      if (!signedIn) {
        const res = await Api.auth.signUp(String(d.get("email")).trim(), String(d.get("password")), payload.firstName, payload.lastName);
        signedIn = Boolean(res?.session);
      }
      if (!signedIn) {
        Remote.savePending(payload);   // envoyée après la confirmation de l'adresse e-mail
        return showDone(payload.firstName, church, String(d.get("email")).trim());
      }
      await Remote.register(payload);
      showDone(payload.firstName, church, null);
    } catch (err) {
      error.textContent = err.message;
      next.disabled = false;
      next.textContent = "Envoyer ma demande au référent";
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validStep(current)) return;
    if (current < steps.length - 1) return show(current + 1);

    const d = new FormData(form);
    const church = CH.church(d.get("church"));
    if (Remote.on) return submitRemote(d, church);
    const user = {
      firstName: CH.clean(d.get("firstName"), 60), lastName: CH.clean(d.get("lastName"), 60),
      gender: d.get("gender"), age: Number(d.get("age")), city: CH.clean(d.get("city"), 80),
      churchId: church.id, status: "en_attente_validation", candidateId: "k1", colors: ["#3d7a5a", "#2f5f8a"],
      plan: d.get("plan"), paid: false, // le paiement intervient après la validation du référent
      photo: photos.photo, photos: photos.photos.slice(0, PHOTO_MAX_EXTRA)
    };
    Store.resetMember();
    Store.update(s => {
      s.user = user;
      s.interests = {}; s.messages = {}; s.chatRead = {}; s.discernment = {}; s.modules = {};
      s.candidates.k1 = { name: `${user.firstName} ${user.lastName}`, age: user.age, city: user.city, interview: "a_planifier", decision: null, since: "Aujourd'hui", plan: user.plan };
    });

    showDone(user.firstName, church, null);
  });

  show(0);
  }
});
