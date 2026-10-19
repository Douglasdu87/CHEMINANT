/* Vue « Politique de confidentialité » — #/confidentialite */
/* Texte à faire valider par un juriste avant l'ouverture au public (RGPD, données sensibles art. 9) */
App.view("confidentialite", {
  layout: "public",
  title: "Politique de confidentialité",
  template: () => `
  <section class="section">
    <div class="container"><div class="transp-text">
      <span class="eyebrow">Confiance</span>
      <h1>Politique de confidentialité</h1>
      <p class="lead">Cheminant traite des informations personnelles, dont certaines révèlent vos convictions religieuses. Voici ce que nous collectons, pourquoi, qui y accède et comment exercer vos droits.</p>

      <h2>Qui est responsable de vos données ?</h2>
      <p>L'équipe Cheminant, éditrice de la plateforme, est responsable du traitement. Votre église partenaire et votre référent reçoivent les informations nécessaires à la validation de votre candidature et à votre accompagnement.</p>

      <h2>Quelles données, et pourquoi ?</h2>
      <ul class="checks">
        <li><strong>Compte</strong> : adresse e-mail, prénom, nom. Pour vous identifier et sécuriser votre accès.</li>
        <li><strong>Profil</strong> : âge, ville, profession, présentation, photos. Pour vous présenter aux autres membres validés.</li>
        <li><strong>Foi et église</strong> (données sensibles) : église de rattachement, réponses au questionnaire de foi et de projet de vie. Pour la validation par votre référent et pour vous proposer des profils. Ce traitement repose sur <strong>votre consentement explicite</strong>, recueilli à l'inscription.</li>
        <li><strong>Échanges</strong> : messages, intérêts, étapes de discernement, progression à l'École du mariage. Pour faire fonctionner le service.</li>
        <li><strong>Formule</strong> : formule choisie, dates et montants des règlements. Aucune donnée bancaire n'est saisie ni conservée sur Cheminant : le règlement se fait chez le prestataire de paiement.</li>
        <li><strong>Sécurité</strong> : signalements, décisions de modération, date de dernière connexion.</li>
      </ul>

      <h2>Qui voit quoi ?</h2>
      <ul class="checks">
        <li>Les autres membres voient votre profil seulement s'il a été validé par votre référent. Ils ne voient jamais votre nom de famille ni votre adresse e-mail.</li>
        <li>Votre référent voit votre candidature et votre parcours. Il ne lit pas vos conversations, sauf les extraits que vous joignez vous-même à un signalement.</li>
        <li>L'administrateur de Cheminant traite les signalements. L'auteur d'un signalement n'est jamais révélé à la personne signalée.</li>
        <li>Un score de compatibilité est calculé en interne, mais il ne décide jamais seul : <a href="#/transparence">voir son fonctionnement</a>.</li>
      </ul>

      <h2>Où sont-elles hébergées ?</h2>
      <p>Les données sont stockées dans l'Union européenne (Supabase, centre de données d'Irlande). Le site est servi par Vercel. Ces prestataires agissent comme sous-traitants et n'utilisent pas vos données pour leur propre compte.</p>

      <h2>Combien de temps ?</h2>
      <ul class="checks">
        <li>Votre profil et vos échanges : tant que votre compte est ouvert. Après une demande de suppression, votre profil est retiré immédiatement et effacé dans un délai d'un mois.</li>
        <li>Les règlements : la durée imposée par les obligations comptables, sous forme pseudonymisée.</li>
        <li>Les signalements et sanctions : le temps nécessaire à la sécurité de la communauté, sous forme pseudonymisée après suppression du compte.</li>
        <li>Une candidature commencée sur votre appareil avant la confirmation de votre adresse e-mail y est effacée après 7 jours.</li>
      </ul>

      <h2>Vos droits</h2>
      <p>Vous pouvez à tout moment accéder à vos données, les rectifier, les exporter, vous opposer aux suggestions automatiques et retirer votre consentement en supprimant votre compte. L'export et la demande de suppression se trouvent dans <a href="#/mon-profil">Mon profil</a>. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).</p>
    </div></div>
  </section>
`
});
