/* Vue « Devenir église partenaire » — #/eglise-partenaire */
App.view("eglise-partenaire", {
  layout: "public",
  title: "Devenir église partenaire",
  template: () => `
  <section class="hero hero--center" style="padding-bottom:40px">
    <div class="container">
      <span class="eyebrow">Églises partenaires</span>
      <h1>Accompagnez vos membres vers <em>l'alliance</em></h1>
      <p class="lead">Cheminant s'appuie sur les églises locales. En devenant partenaire, vous désignez un référent qui valide les membres de votre communauté et les accompagne jusqu'au mariage.</p>
      <div class="hero__cta">
        <a class="btn btn--primary btn--lg" href="#/eglise-partenaire/adhesion">Demander l'adhésion</a>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="section__head section__head--center">
        <span class="eyebrow">Le rôle du référent</span>
        <h2>Une présence pastorale à chaque étape</h2>
        <p class="lead mb-0">Votre sécurité n'est pas négociable.</p>
      </div>
      <div class="grid grid--4 grid--centered">
        <article class="card card--flat"><div class="card__icon card__icon--gold"><i data-icon="calendar"></i></div><h3>Entretien</h3><p class="muted small mb-0">Il rencontre chaque membre qui s'inscrit, pour connaître sa démarche.</p></article>
        <article class="card card--flat"><div class="card__icon card__icon--sage"><i data-icon="shield"></i></div><h3>Validation</h3><p class="muted small mb-0">Il valide, met en attente ou demande des informations, avec discrétion.</p></article>
        <article class="card card--flat"><div class="card__icon"><i data-icon="hands"></i></div><h3>Accompagnement</h3><p class="muted small mb-0">Il peut être sollicité pendant le discernement, et suit les couples en cheminement.</p></article>
        <article class="card card--flat"><div class="card__icon card__icon--sky"><i data-icon="ring"></i></div><h3>Préparation</h3><p class="muted small mb-0">Il conduit l'entretien pastoral pré-mariage et la préparation de la célébration.</p></article>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container split" style="align-items:start">
      <div>
        <span class="eyebrow">Engagements réciproques</span>
        <h2>Un partenariat simple et clair</h2>
        <ul class="checks">
          <li><span><strong>Gratuit pour les églises.</strong> L'adhésion et l'espace référent sont sans frais.</span></li>
          <li><span><strong>Un ou plusieurs référents</strong> désignés par la direction de l'église (pasteur, prêtre, ancien, responsable de pastorale…).</span></li>
          <li><span><strong>Formation des référents</strong> : un guide de l'entretien de validation et des bonnes pratiques de confidentialité.</span></li>
          <li><span><strong>Confidentialité</strong> : le référent n'a pas accès aux conversations des membres, et les motifs de décision restent internes.</span></li>
          <li><span><strong>Respect de votre tradition</strong> : catholiques, protestantes, évangéliques, pentecôtistes, orthodoxes… toutes les églises chrétiennes sont bienvenues.</span></li>
        </ul>
        <div class="alert alert--gold"><i data-icon="info"></i><p>Chaque demande est examinée par l'équipe Cheminant, qui prend contact avec le responsable de l'église avant d'activer le partenariat.</p></div>
      </div>

      <div class="card" id="adhesion">
        <form id="partner-form" novalidate>
          <h2 style="font-size:1.6rem">Demande d'adhésion</h2>
          <div class="field"><label for="pf-church">Nom de l'église</label><input class="input" id="pf-church" name="church" required></div>
          <div class="field-row">
            <div class="field"><label for="pf-city">Ville</label><input class="input" id="pf-city" name="city" required></div>
            <div class="field"><label for="pf-denom">Sensibilité</label>
              <select class="select" id="pf-denom" name="denomination" required>
                <option value="">Choisir…</option><option>Catholique</option><option>Protestante</option><option>Évangélique</option><option>Pentecôtiste</option><option>Baptiste</option><option>Adventiste</option><option>Orthodoxe</option><option>Autre</option>
              </select>
            </div>
          </div>
          <div class="field"><label for="pf-members">Nombre de membres</label>
            <select class="select" id="pf-members" name="members"><option>Moins de 50</option><option selected>50 à 150</option><option>150 à 500</option><option>Plus de 500</option></select>
          </div>
          <div class="field"><label for="pf-contact">Responsable de l'église</label><input class="input" id="pf-contact" name="contact" required placeholder="Ex. Pasteur Jean Martin"></div>
          <div class="field-row">
            <div class="field"><label for="pf-email">E-mail</label><input class="input" type="email" id="pf-email" name="email" required autocomplete="email"></div>
            <div class="field"><label for="pf-phone">Téléphone</label><input class="input" type="tel" id="pf-phone" name="phone" autocomplete="tel"></div>
          </div>
          <div class="field"><label for="pf-referent">Référent pressenti</label><input class="input" id="pf-referent" name="referent" required><span class="hint">Vous pourrez en ajouter d'autres ensuite.</span></div>
          <div class="field"><label for="pf-msg">Message (facultatif)</label><textarea class="textarea" id="pf-msg" name="message"></textarea></div>
          <label class="check"><input type="checkbox" name="charter" required><span>La direction de l'église approuve cette demande et adhère à la charte des églises partenaires.</span></label>
          <p class="small" id="pf-error" role="alert" style="color:var(--color-danger);min-height:1.4em;margin:4px 0 8px"></p>
          <button class="btn btn--primary btn--block">Envoyer la demande</button>
        </form>
        <div id="partner-done" hidden style="text-align:center">
          <div class="card__icon card__icon--sage" style="width:64px;height:64px;margin:0 auto 16px"><i data-icon="send" data-size="28"></i></div>
          <h2 style="font-size:1.6rem">Merci !</h2>
          <p class="muted" id="partner-done-text"></p>
          <a class="btn btn--ghost" href="#/">Retour à l'accueil</a>
        </div>
      </div>
    </div>
  </section>
`,
  init(ctx) {
  document.getElementById("partner-form").addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    const error = document.getElementById("pf-error");
    const invalid = [...form.elements].find(f => f.willValidate && !f.checkValidity());
    if (invalid) {
      invalid.focus();
      error.textContent = invalid.type === "checkbox"
        ? "L'accord de la direction de l'église est nécessaire."
        : `Champ à compléter : ${form.querySelector(`label[for="${invalid.id}"]`).textContent}.`;
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    Store.update(s => {
      s.partnerRequests.unshift({
        id: "r" + Date.now(), church: CH.clean(d.church), city: CH.clean(d.city, 80), denomination: CH.clean(d.denomination, 80),
        contact: CH.clean(d.contact, 80), referent: CH.clean(d.referent, 80), members: CH.clean(d.members, 20),
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }), status: "nouvelle"
      });
    });
    form.hidden = true;
    document.getElementById("partner-done-text").textContent =
      `La demande de « ${d.church.trim()} » a bien été reçue. L'équipe Cheminant prendra contact avec ${d.contact.trim()} sous quelques jours.`;
    document.getElementById("partner-done").hidden = false;
  });
  }
});
