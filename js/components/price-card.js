/* =========================================================
   Carte tarifaire (SINGLE / CHEMINONS), partagée par l'accueil et la page de paiement
   ========================================================= */

function priceAmountHtml(amount, currency) {
  const value = new Intl.NumberFormat("fr-FR").format(amount);
  return `<span class="price-card__value" data-amount="${amount}">${value}</span><small> ${currency === "XOF" ? "FCFA" : "€"}</small>`;
}

/* action : HTML du bouton en bas de carte ; extra : classes supplémentaires */
function priceCard(region, key, action, extra = "") {
  const r = CH_DATA.pricing.find(x => x.region === region);
  const p = r.plans[key];
  const plan = CH_DATA.plans[key];
  const quarterly = key === "cheminant";
  const saving = CH.money(CH.quarterlySaving(region), r.currency);
  const features = quarterly ? [...plan.features, `${saving} d'économie par rapport à 3 mois de SINGLE`] : plan.features;
  return `
    <article class="price-card ${quarterly ? "price-card--featured" : ""} ${extra}">
      ${quarterly ? `<span class="price-card__saving">${saving} d'économie</span>` : ""}
      <p class="price-card__audience">${plan.audience}</p>
      <h4 class="price-card__name">${plan.name}</h4>
      <p class="price-card__amount">${priceAmountHtml(p.amount, r.currency)}</p>
      <p class="price-card__period">${p.period}</p>
      <ul class="price-card__features">${features.map(f => `<li>${f}</li>`).join("")}</ul>
      ${action}
    </article>`;
}

/* En-tête de région (« Candidats d'Europe », note sur la devise) */
function priceRegionHead(region, id) {
  const r = CH_DATA.pricing.find(x => x.region === region);
  return `
    <header class="pricing__region-head">
      <h3 id="${id}">${icon("map", 18)} Candidats d'${r.label}</h3>
      <span>${r.note}</span>
    </header>`;
}
