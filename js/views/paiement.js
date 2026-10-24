/* Vue « Paiement » — #/paiement
   Après la validation par le référent : choix de la formule (mensuelle ou trimestrielle),
   du moyen de paiement, puis règlement sur la page sécurisée du prestataire.
   Une fois réglée, la formule ouvre la messagerie et rend le profil définitif. */
App.view("paiement", {
  layout: "app",
  title: "Ma formule",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Dernière étape</span>
      <h1>Choisir et régler ma formule</h1>
    </div>
    <div id="pay-root"></div>
  </div>
`,
  init(ctx) {
  const $ = id => document.getElementById(id);
  const root = $("pay-root");
  const s0 = Store.read();
  let region = s0.user.paymentRegion || CH.region(s0.user.churchId); // région de la formule choisie
  const methodsOf = r => CH_DATA.paymentMethods[r];
  const date = iso => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  // Formule demandée dans l'adresse : seulement si elle existe
  const asked = ctx.param("formule");
  let plan = Object.hasOwn(CH_DATA.plans, asked || "") ? asked : (s0.user.plan || "single");
  let method = methodsOf(region)[0].key;

  /* Le paiement n'intervient qu'après la validation du profil */
  if (s0.user.status !== "actif") {
    root.innerHTML = `
      <div class="card card--soft empty">
        ${icon("lock", 44)}
        <h2 style="font-size:1.5rem">Le paiement intervient après la validation de votre profil</h2>
        <p>Votre référent doit d'abord vous recevoir en entretien et valider votre candidature. Vous choisirez ensuite votre formule ici.</p>
        <a class="btn btn--primary" href="#/tableau-de-bord">Suivre ma validation</a>
      </div>`;
    return;
  }

  /* ---------- Formule déjà réglée ---------- */
  function renderActive() {
    const s = Store.read();
    const p = CH.price(region, s.user.plan || "single");
    const m = methodsOf(region).find(x => x.key === s.user.paymentMethod);
    root.innerHTML = `
      <div class="pay-layout">
        <section class="card">
          <span class="badge badge--sage">${icon("check", 13)} Formule active</span>
          <h2 style="font-size:1.6rem;margin:12px 0 4px">${CH_DATA.plans[s.user.plan || "single"].name}</h2>
          <p class="muted">${CH.money(p.amount, p.currency)} ${p.period}${s.user.paidUntil ? ` · ${s.user.renews ? "prochain renouvellement le" : "valable jusqu'au"} <strong>${date(s.user.paidUntil)}</strong>` : ""}${m ? ` · ${m.label}` : ""}</p>
          ${s.user.renews === false && s.user.paidUntil ? `<p class="small muted">Renouvellement résilié : aucun nouveau prélèvement. Vous pouvez reprendre une formule à tout moment.</p>` : ""}
          <div class="flex">
            <a class="btn btn--primary" href="#/messages">${icon("chat", 18)} Messagerie</a>
            <a class="btn btn--ghost" href="#/mon-profil">Mon profil</a>
            <button class="btn btn--ghost" id="btn-change">Changer de formule</button>
            ${s.user.renews ? `<button class="btn btn--ghost" id="btn-cancel">Résilier le renouvellement</button>` : ""}
          </div>
        </section>
        ${(s.payments || []).length ? `
        <section class="card">
          <h2 style="font-size:1.2rem">Historique des paiements</h2>
          <ul class="pay-history">${s.payments.map(x => `
            <li><span>${date(x.date)} · ${CH_DATA.plans[x.plan].name}</span><strong>${CH.money(x.amount, x.currency)}</strong></li>`).join("")}</ul>
        </section>` : ""}
      </div>`;
    $("btn-change").addEventListener("click", renderChoice);
    /* Résiliation en deux temps : le premier clic demande confirmation */
    $("btn-cancel")?.addEventListener("click", async e => {
      const b = e.currentTarget;
      if (!b.dataset.confirm) {
        b.dataset.confirm = "1";
        b.textContent = `Confirmer : plus de prélèvement après le ${date(s.user.paidUntil)}`;
        return;
      }
      b.disabled = true;
      try {
        await Api.payments.cancel();
        if (Remote.on) await Remote.refresh();
        toast("Renouvellement résilié. Votre formule reste active jusqu'à la fin de la période réglée.");
        renderActive();
      } catch (err) {
        toast(err.message);
        b.disabled = false;
      }
    });
  }

  /* ---------- Choix de la formule et du moyen de paiement ---------- */
  function renderChoice() {
    const p = CH.price(region, plan);
    root.innerHTML = `
      <p class="lead" style="margin-top:-8px">Votre référent a validé votre profil. Réglez votre formule pour accéder à la messagerie et rendre votre profil visible des autres membres.</p>
      <form id="pay-form">
        <fieldset class="pay-step pay-step--plans">
          <legend class="pay-step__title"><span class="pay-step__num">1</span> Votre formule</legend>
          <div class="pricing__regions">${CH_DATA.pricing.map(r => `
            <section class="pricing__region" aria-labelledby="pay-${r.region}">
              ${priceRegionHead(r.region, "pay-" + r.region)}
              <div class="pricing__cards">
                ${Object.keys(r.plans).map(key => {
                  const chosen = key === plan && r.region === region;
                  return priceCard(r.region, key,
                    `<button type="button" class="btn ${key === "cheminant" ? "btn--light" : "btn--primary"} btn--block" data-plan="${key}" data-region="${r.region}" aria-pressed="${chosen}">
                       ${chosen ? `${icon("check", 16)} Formule choisie` : `Choisir ${CH_DATA.plans[key].name}`}</button>`,
                    chosen ? "is-selected" : "");
                }).join("")}
              </div>
            </section>`).join("")}
          </div>
        </fieldset>

        <div class="pay-layout">
          <fieldset class="card pay-step">
            <legend class="pay-step__title"><span class="pay-step__num">2</span> Moyen de paiement</legend>
            <div class="pay-methods">${methodsOf(region).map(m => `
              <div class="plan-option">
                <input type="radio" name="method" id="m-${m.key}" value="${m.key}" ${m.key === method ? "checked" : ""}>
                <label for="m-${m.key}"><span><strong>${m.label}</strong><span class="small muted">${m.detail} · via ${m.provider}</span></span></label>
              </div>`).join("")}</div>
            <p class="small muted mb-0" style="margin-top:12px">${icon("lock", 14)} Vous réglerez sur la page sécurisée du prestataire (${methodsOf(region).find(m => m.key === method).provider}). Cheminons ne voit ni ne conserve vos coordonnées bancaires ou de paiement.</p>
          </fieldset>

        <aside class="card pay-summary" aria-live="polite">
          <span class="pay-step__title"><span class="pay-step__num">3</span> Récapitulatif</span>
          <dl>
            <div><dt>Formule</dt><dd>${CH_DATA.plans[plan].name}</dd></div>
            <div><dt>Durée</dt><dd>${p.months} mois</dd></div>
            <div><dt>Tarif</dt><dd>${CH_DATA.pricing.find(r => r.region === region).label}</dd></div>
            <div><dt>Moyen de paiement</dt><dd>${methodsOf(region).find(m => m.key === method).label}</dd></div>
            <div><dt>Dont taxes (${Math.round(p.taxRate * 100)}&nbsp;%)</dt><dd>${CH.money(p.currency === "XOF" ? Math.round(p.amount - p.amount / (1 + p.taxRate)) : Math.round((p.amount - p.amount / (1 + p.taxRate)) * 100) / 100, p.currency)}</dd></div>
          </dl>
          <div class="pay-summary__total"><span>Total TTC</span><strong>${CH.money(p.amount, p.currency)}</strong></div>
          <label class="check"><input type="checkbox" id="pay-cgv"><span>J'accepte les conditions générales et le renouvellement automatique ${p.months === 1 ? "chaque mois" : "chaque trimestre"}, résiliable à tout moment depuis cette page.</span></label>
          <button type="button" class="btn btn--primary btn--block btn--lg" id="pay-go" disabled>Payer ${CH.money(p.amount, p.currency)}</button>
          ${Remote.on ? "" : `<p class="small muted mb-0">Démo : aucun paiement n'est réellement effectué.</p>`}
        </aside>
        </div>
      </form>`;

    root.querySelectorAll("[data-plan]").forEach(b => b.addEventListener("click", () => {
      plan = b.dataset.plan;
      if (b.dataset.region !== region) {
        region = b.dataset.region;
        method = methodsOf(region)[0].key; // moyens de paiement de la région choisie
      }
      renderChoice();
      root.querySelector(`[data-plan="${plan}"][data-region="${region}"]`).focus();
    }));
    $("pay-form").addEventListener("change", e => {
      if (e.target.name !== "method") return; // la case des conditions n'entraîne pas de nouveau rendu
      method = e.target.value;
      renderChoice();
      root.querySelector(`input[name="${e.target.name}"]:checked`)?.focus();
    });
    $("pay-form").addEventListener("submit", e => e.preventDefault());
    $("pay-cgv").addEventListener("change", e => ($("pay-go").disabled = !e.target.checked));
    $("pay-go").addEventListener("click", pay);
  }

  /* ---------- Règlement puis confirmation ----------
     Démo : simulé dans le navigateur. Mode supabase : POST /payments/checkout ; le serveur
     renvoie l'adresse du prestataire (redirection) ou, en mode « simulation », le paiement enregistré. */
  async function pay() {
    const btn = $("pay-go");
    btn.disabled = true;
    btn.textContent = "Redirection vers le paiement sécurisé…";
    if (!Remote.on) {
      const t = setTimeout(() => showConfirmation(CH.subscribe(plan, method, region)), 1400);
      ctx.onLeave(() => clearTimeout(t));
      return;
    }
    try {
      const res = await Api.payments.checkout(plan, method, region);
      if (res.checkoutUrl && /^https:\/\//.test(res.checkoutUrl)) { location.href = res.checkoutUrl; return; }
      await Remote.refresh();
      showConfirmation(res.payment);
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = `Payer ${CH.money(CH.price(region, plan).amount, CH.price(region, plan).currency)}`;
    }
  }

  function showConfirmation(payment) {
      root.innerHTML = `
        <section class="card pay-done">
          <span class="card__icon card__icon--sage" style="width:64px;height:64px">${icon("check", 28)}</span>
          <h2 style="font-size:1.8rem;margin:0">Paiement confirmé</h2>
          <p class="muted">Votre formule <strong>${CH_DATA.plans[plan].name}</strong> est active jusqu'au <strong>${date(payment.until)}</strong>. Votre profil est désormais définitif et visible des autres membres validés, et la messagerie vous est ouverte.</p>
          <div class="flex" style="justify-content:center">
            <a class="btn btn--primary" href="#/messages">${icon("chat", 18)} Ouvrir la messagerie</a>
            <a class="btn btn--ghost" href="#/mon-profil">Voir mon profil</a>
          </div>
          <p class="small muted mb-0">Un reçu vous est envoyé par e-mail.</p>
        </section>`;
      window.scrollTo({ top: 0, behavior: "instant" });
      document.querySelector(".pay-done h2").setAttribute("tabindex", "-1");
      document.querySelector(".pay-done h2").focus({ preventScroll: true });
  }

  /* ---------- Retour de la page d'abonnement Stripe ou PayPal ----------
     L'échéance est enregistrée à la confirmation (ou par le webhook du prestataire, s'il arrive avant) ;
     le prestataire peut mettre quelques secondes à confirmer le premier prélèvement. */
  async function confirmReturn(provider, ref) {
    root.innerHTML = `
      <section class="card pay-done" aria-live="polite">
        <h2 style="font-size:1.6rem;margin:0">Confirmation de votre paiement…</h2>
        <p class="muted mb-0">Merci de patienter quelques secondes.</p>
      </section>`;
    let leaving = false;
    ctx.onLeave(() => { leaving = true; });
    try {
      for (let i = 0; i < 6 && !leaving; i++) {
        const res = await Api.payments.confirm(provider, ref);
        if (res.status === "paye") {
          await Remote.refresh();
          const s = Store.read();
          plan = s.user.plan || plan;
          return showConfirmation({ until: s.user.paidUntil });
        }
        await new Promise(r => setTimeout(r, 2500));
      }
      if (leaving) return;
      root.innerHTML = `
        <section class="card pay-done">
          <h2 style="font-size:1.6rem;margin:0">Paiement en cours de confirmation</h2>
          <p class="muted">Le prestataire n'a pas encore confirmé votre premier prélèvement. Votre formule s'activera automatiquement dès sa confirmation : la messagerie s'ouvrira alors.</p>
          <a class="btn btn--primary" href="#/tableau-de-bord">Revenir au tableau de bord</a>
        </section>`;
    } catch (err) {
      toast(err.message);
      renderChoice();
    }
  }

  const retour = ctx.param("retour"), ref = ctx.param("ref") || "";
  if (["stripe", "paypal"].includes(retour) && /^[A-Za-z0-9_-]{6,200}$/.test(ref) && Remote.on) confirmReturn(retour, ref);
  else if (CH.memberPaid(s0) && !ctx.param("formule")) renderActive();
  else renderChoice();
  }
});
