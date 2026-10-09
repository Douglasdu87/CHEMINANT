/* Vue « Flux financiers » — #/finances
   Réservée au super administrateur : toutes les inscriptions validées du réseau,
   avec la répartition de chaque montant (taxes, référent, église, part du site).
   Les devises ne sont jamais additionnées entre elles : un onglet par devise. */
App.view("finances", {
  layout: "admin",
  title: "Flux financiers",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Administration Cheminant</span>
      <div class="page-head__row">
        <h1>Flux financiers</h1>
        <span class="earnings__private">${icon("lock", 14)} Vue réservée au super administrateur</span>
      </div>
      <p class="muted mb-0" style="margin-top:10px;max-width:760px">Chaque inscription validée vaut le prix de sa formule. Après déduction des taxes, 10&nbsp;% du montant hors taxes revient au référent qui a validé, 10&nbsp;% à son église, et le reste à Cheminant.</p>
    </div>

    <div class="fin-toolbar">
      <div class="tabs fin-tabs" role="tablist" aria-label="Devise" id="fin-currency"></div>
      <div class="fin-period">
        <label for="fin-period" class="small muted">Période</label>
        <select class="select" id="fin-period"></select>
      </div>
    </div>

    <!-- 1. Synthèse -->
    <section class="fin-block" aria-labelledby="fin-sum-title">
      <h2 class="fin-block__title" id="fin-sum-title">Synthèse</h2>
      <div class="fin-kpis" id="fin-kpis"></div>
    </section>

    <!-- 2. Répartition -->
    <section class="fin-block" aria-labelledby="fin-split-title">
      <h2 class="fin-block__title" id="fin-split-title">Répartition des sommes encaissées</h2>
      <div class="card fin-split" id="fin-split"></div>
    </section>

    <!-- 3. Par église / par référent -->
    <section class="fin-block" aria-labelledby="fin-who-title">
      <h2 class="fin-block__title" id="fin-who-title">Reversements par bénéficiaire</h2>
      <div class="fin-grid">
        <div>
          <h3 class="fin-sub">Par église</h3>
          <div class="table-wrap"><table class="table table--compact">
            <thead><tr><th scope="col">Église</th><th scope="col" class="num">Inscriptions</th><th scope="col" class="num">Montant HT</th><th scope="col" class="num">Part église</th></tr></thead>
            <tbody id="fin-churches"></tbody><tfoot id="fin-churches-total"></tfoot>
          </table></div>
        </div>
        <div>
          <h3 class="fin-sub">Par référent</h3>
          <div class="table-wrap"><table class="table table--compact">
            <thead><tr><th scope="col">Référent</th><th scope="col" class="num">Inscriptions</th><th scope="col" class="num">Part référent</th></tr></thead>
            <tbody id="fin-referents"></tbody><tfoot id="fin-referents-total"></tfoot>
          </table></div>
        </div>
      </div>
    </section>

    <!-- 4. Transactions -->
    <section class="fin-block" aria-labelledby="fin-tx-title">
      <div class="fin-block__head">
        <h2 class="fin-block__title" id="fin-tx-title">Toutes les transactions</h2>
        <div class="fin-block__tools">
          <label for="fin-search" class="sr-only">Rechercher un membre, une église ou un référent</label>
          <input class="input" type="search" id="fin-search" placeholder="Membre, église, référent…">
          <button class="btn btn--ghost" type="button" id="fin-export">${icon("download", 16)} Exporter (CSV)</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="table table--compact table--ledger">
          <thead><tr>
            <th scope="col">Date</th><th scope="col">Membre</th><th scope="col">Église et référent</th><th scope="col">Formule</th>
            <th scope="col" class="num">Encaissé TTC</th><th scope="col" class="num">Taxes</th><th scope="col" class="num">HT</th>
            <th scope="col" class="num">Référent</th><th scope="col" class="num">Église</th><th scope="col" class="num">Cheminant</th>
          </tr></thead>
          <tbody id="fin-rows"></tbody><tfoot id="fin-rows-total"></tfoot>
        </table>
      </div>
      <p class="small muted" style="margin-top:12px">Les référents et les églises ne voient que leur propre part, dans leur espace. Les membres ne voient aucun de ces montants.</p>
    </section>
  </div>
`,
  init() {
    const $ = id => document.getElementById(id);
    const all = CH.ledger();
    const regions = CH_DATA.pricing.filter(r => all.some(t => t.currency === r.currency));
    let currency = regions[0]?.currency || "EUR";
    let period = "all";
    let query = "";

    /* Onglets devise et liste des mois disponibles */
    $("fin-currency").innerHTML = regions.map(r => `
      <button class="tab" role="tab" type="button" data-cur="${r.currency}">${r.currency === "XOF" ? "Francs CFA" : "Euros"} <span class="muted">(${r.label})</span></button>`).join("");
    const months = [...new Set(all.map(t => t.validatedAt.slice(0, 7)))].sort().reverse();
    $("fin-period").innerHTML = `<option value="all">Depuis le début</option>` + months.map(m =>
      `<option value="${m}">${CH.formatDate(m + "-01", { month: "long", year: "numeric" })}</option>`).join("");

    const money = n => CH.money(n, currency);
    const sum = (rows, key) => Math.round(rows.reduce((n, r) => n + r[key], 0) * 100) / 100;

    function rowsInScope() {
      return all.filter(t => t.currency === currency && (period === "all" || t.validatedAt.startsWith(period)));
    }

    function groupBy(rows, key, label = key) {
      const map = new Map();
      rows.forEach(r => {
        const g = map.get(r[key]) || { name: r[label], church: r.church, city: r.city, count: 0, net: 0, toChurch: 0, toReferent: 0 };
        g.count++; g.net += r.net; g.toChurch += r.toChurch; g.toReferent += r.toReferent;
        map.set(r[key], g);
      });
      return [...map.values()];
    }

    function render() {
      const scope = rowsInScope();
      const filtered = query
        ? scope.filter(t => `${t.name} ${t.church} ${t.city} ${t.referent}`.toLowerCase().includes(query))
        : scope;
      const T = { gross: sum(scope, "gross"), tax: sum(scope, "tax"), net: sum(scope, "net"), ref: sum(scope, "toReferent"), church: sum(scope, "toChurch"), site: sum(scope, "toPlatform") };

      document.querySelectorAll("#fin-currency .tab").forEach(b => b.setAttribute("aria-selected", b.dataset.cur === currency));

      /* 1. Synthèse */
      $("fin-kpis").innerHTML = `
        <div class="fin-kpi"><span>Encaissé TTC</span><strong>${money(T.gross)}</strong><small>${scope.length} inscription${scope.length > 1 ? "s" : ""} validée${scope.length > 1 ? "s" : ""}</small></div>
        <div class="fin-kpi"><span>Taxes collectées</span><strong>${money(T.tax)}</strong><small>À reverser à l'administration fiscale</small></div>
        <div class="fin-kpi"><span>Montant hors taxes</span><strong>${money(T.net)}</strong><small>Base de calcul des reversements</small></div>
        <div class="fin-kpi"><span>Reversé aux référents et églises</span><strong>${money(T.ref + T.church)}</strong><small>Dont ${money(T.ref)} aux référents et ${money(T.church)} aux églises</small></div>
        <div class="fin-kpi fin-kpi--site"><span>Part Cheminant</span><strong>${money(T.site)}</strong><small>${Math.round((1 - CH_DATA.reversion.referent - CH_DATA.reversion.church) * 100)}&nbsp;% du montant hors taxes</small></div>`;

      /* 2. Répartition : barre empilée + légende chiffrée */
      const parts = [
        ["Taxes", T.tax, "tax"], ["Référents", T.ref, "ref"], ["Églises", T.church, "church"], ["Cheminant", T.site, "site"]
      ];
      const pct = v => T.gross ? (v / T.gross) * 100 : 0;
      $("fin-split").innerHTML = T.gross ? `
        <div class="fin-bar" role="img" aria-label="${parts.map(([l, v]) => `${l} ${pct(v).toFixed(1)} %`).join(", ")}">
          ${parts.map(([, v, k]) => `<span class="fin-bar__seg fin-bar__seg--${k}" style="width:${pct(v)}%"></span>`).join("")}
        </div>
        <ul class="fin-legend">
          ${parts.map(([l, v, k]) => `
            <li><span class="fin-legend__dot fin-bar__seg--${k}"></span>
              <span class="fin-legend__label">${l}</span>
              <strong>${money(v)}</strong><span class="fin-legend__pct">${pct(v).toFixed(1).replace(".", ",")}&nbsp;%</span></li>`).join("")}
        </ul>` : `<p class="muted mb-0">Aucune transaction sur cette période.</p>`;

      /* 3. Par église / par référent */
      const byChurch = groupBy(scope, "church").sort((a, b) => b.toChurch - a.toChurch);
      $("fin-churches").innerHTML = byChurch.map(g => `
        <tr><td><strong>${CH.escape(g.name)}</strong><br><span class="small muted">${CH.escape(g.city)}</span></td>
          <td class="num">${g.count}</td><td class="num">${money(g.net)}</td><td class="num"><strong>${money(g.toChurch)}</strong></td></tr>`).join("")
        || `<tr><td colspan="4" class="empty">Aucune église sur cette période.</td></tr>`;
      $("fin-churches-total").innerHTML = byChurch.length ? `<tr><th scope="row">Total</th><td class="num">${scope.length}</td><td class="num">${money(T.net)}</td><td class="num">${money(T.church)}</td></tr>` : "";

      const byRef = groupBy(scope, "referentId", "referent").sort((a, b) => b.toReferent - a.toReferent);
      $("fin-referents").innerHTML = byRef.map(g => `
        <tr><td><strong>${CH.escape(g.name)}</strong><br><span class="small muted">${CH.escape(g.church)}</span></td>
          <td class="num">${g.count}</td><td class="num"><strong>${money(g.toReferent)}</strong></td></tr>`).join("")
        || `<tr><td colspan="3" class="empty">Aucun référent sur cette période.</td></tr>`;
      $("fin-referents-total").innerHTML = byRef.length ? `<tr><th scope="row">Total</th><td class="num">${scope.length}</td><td class="num">${money(T.ref)}</td></tr>` : "";

      /* 4. Transactions */
      $("fin-rows").innerHTML = filtered.map(t => `
        <tr>
          <td class="small nowrap">${CH.formatDate(t.validatedAt)}</td>
          <td><strong>${CH.escape(t.name)}</strong></td>
          <td class="small">${CH.escape(t.church)}<br><span class="muted">${CH.escape(t.referent)}</span></td>
          <td><span class="badge">${CH_DATA.plans[t.plan].name}</span></td>
          <td class="num">${money(t.gross)}</td><td class="num muted">${money(t.tax)}</td><td class="num">${money(t.net)}</td>
          <td class="num">${money(t.toReferent)}</td><td class="num">${money(t.toChurch)}</td><td class="num"><strong>${money(t.toPlatform)}</strong></td>
        </tr>`).join("") || `<tr><td colspan="10" class="empty">Aucune transaction ne correspond.</td></tr>`;
      const F = k => money(sum(filtered, k));
      $("fin-rows-total").innerHTML = filtered.length ? `
        <tr><th scope="row" colspan="4">Total (${filtered.length} transaction${filtered.length > 1 ? "s" : ""})</th>
          <td class="num">${F("gross")}</td><td class="num">${F("tax")}</td><td class="num">${F("net")}</td>
          <td class="num">${F("toReferent")}</td><td class="num">${F("toChurch")}</td><td class="num">${F("toPlatform")}</td></tr>` : "";
    }

    /* Export CSV de la sélection courante (séparateur « ; » pour Excel en français) */
    function exportCsv() {
      const rows = rowsInScope().filter(t => !query || `${t.name} ${t.church} ${t.city} ${t.referent}`.toLowerCase().includes(query));
      const num = n => String(n).replace(".", ",");
      const head = ["Date", "Membre", "Église", "Ville", "Référent", "Formule", "Devise", "Encaissé TTC", "Taxes", "HT", "Part référent", "Part église", "Part Cheminant"];
      const lines = rows.map(t => [t.validatedAt, t.name, t.church, t.city, t.referent, CH_DATA.plans[t.plan].name, t.currency,
        num(t.gross), num(t.tax), num(t.net), num(t.toReferent), num(t.toChurch), num(t.toPlatform)]);
      const csv = [head, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `cheminant-flux-${currency}-${period}.csv` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`${rows.length} transaction${rows.length > 1 ? "s" : ""} exportée${rows.length > 1 ? "s" : ""}.`);
    }

    $("fin-currency").addEventListener("click", e => {
      const b = e.target.closest("[data-cur]");
      if (b) { currency = b.dataset.cur; render(); }
    });
    $("fin-period").addEventListener("change", e => { period = e.target.value; render(); });
    $("fin-search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); render(); });
    $("fin-export").addEventListener("click", exportCsv);
    render();
  }
});
