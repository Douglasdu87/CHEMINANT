/* Vue « Transparence » — #/transparence */
App.view("transparence", {
  layout: "public",
  title: "Transparence",
  template: () => `
  <section class="section">
    <div class="container"><div class="transp-text">
      <span class="eyebrow">Transparence</span>
      <h1>Comment fonctionne la compatibilité ?</h1>
      <p class="lead">Une rencontre ne se réduit pas à un calcul. Voici, en toute clarté, comment nous utilisons vos réponses.</p>
    </div></div>

    <!-- Pleine largeur du site -->
    <div class="container">
      <div class="grid grid--2 transp-grid">
        <article class="card">
          <div class="card__icon card__icon--sky"><i data-icon="compass"></i></div>
          <h3>Ce que nous comparons</h3>
          <p class="muted small mb-0">Les réponses que vous donnez lors de l'inscription et dans votre profil, selon 9 dimensions :</p>
          <div class="profile-card__tags" style="margin-top:12px" id="dims"></div>
        </article>
        <article class="card">
          <div class="card__icon card__icon--gold"><i data-icon="eye"></i></div>
          <h3>Ce que nous vous montrons</h3>
          <p class="muted small">Un score interne est calculé, mais nous vous présentons plutôt <strong>5 points de convergence</strong> :</p>
          <ul class="conv-list">
            <li><span>Vision chrétienne</span><span class="badge badge--sage">Forte convergence</span></li>
            <li><span>Projet familial</span><span class="badge badge--sage">Convergence</span></li>
            <li><span>Localisation</span><span class="badge badge--sky">Compatible</span></li>
            <li><span>Projet professionnel</span><span class="badge badge--sky">Compatible</span></li>
            <li><span>Vision de l'éducation</span><span class="badge badge--amber">À discuter</span></li>
          </ul>
        </article>
      </div>
    </div>

    <div class="container">
      <h2>Nos engagements</h2>
      <div class="commitments">
        <article><span class="principles__num">I</span><h3>Le score ne décide jamais seul</h3><p>Il sert uniquement à ordonner des suggestions. Aucune décision vous concernant n'est prise de manière automatisée.</p></article>
        <article><span class="principles__num">II</span><h3>L'humain reste au centre</h3><p>La validation des profils est faite par un référent de votre église, et vous pouvez à tout moment demander un accompagnement.</p></article>
        <article><span class="principles__num">III</span><h3>Vous restez libre</h3><p>Vous pouvez explorer tous les profils accessibles, au-delà des suggestions.</p></article>
        <article><span class="principles__num">IV</span><h3>« À discuter » n'est pas un obstacle</h3><p>C'est une invitation au dialogue, pas un jugement.</p></article>
      </div>

      <div class="faq-layout" id="donnees">
        <div>
          <h2>Vos données</h2>
          <p class="muted">Ce que chacun voit, ce qui reste confidentiel, et vos droits sur vos informations.</p>
        </div>
        <div class="faq">
          <details><summary>Qui voit mon profil ?</summary><p>Uniquement les membres dont le profil a été validé par un référent. Votre référent voit les informations nécessaires à la validation.</p></details>
          <details><summary>Que voit mon référent ?</summary><p>Votre identité, votre rattachement à l'église et, si vous l'acceptez, l'information que vous êtes entré(e) dans le parcours en couple. Il ne lit pas vos conversations, sauf les extraits que vous joignez vous-même à un signalement.</p></details>
          <details><summary>Que se passe-t-il en cas de refus ?</summary><p>Le motif d'une décision négative est conservé de manière strictement interne et n'est jamais affiché sur la plateforme. Vous êtes invité(e) à en parler directement avec votre référent.</p></details>
          <details><summary>Puis-je m'opposer au profilage ?</summary><p>Oui. Vous pouvez désactiver les suggestions depuis vos paramètres : vous continuerez à accéder à la recherche classique. Vous pouvez aussi demander l'accès, la rectification ou la suppression de vos données.</p></details>
        </div>
      </div>
    </div>
  </section>
`,
  init(ctx) {
  document.getElementById("dims").innerHTML = CH_DATA.dimensions.map(d => `<span class="badge">${d}</span>`).join("");
  }
});
