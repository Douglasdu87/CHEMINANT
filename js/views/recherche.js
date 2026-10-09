/* Vue « Découvrir » — #/recherche */
/* Recherche de profils */
App.view("recherche", {
  layout: "app",
  title: "Découvrir",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Recherche & suggestions</span>
      <h1>Découvrir des profils</h1>
      <p class="muted mb-0">Tous les profils ci-dessous ont été validés par un référent de leur église.</p>
    </div>

    <div class="search-layout">
      <aside class="card filters" aria-label="Filtres">
        <h3>Affiner</h3>
        <form id="filters">
          <div class="field">
            <label for="f-mode">Afficher</label>
            <select class="select" id="f-mode">
              <option value="all">Tous les profils accessibles</option>
              <option value="suggested">Suggestions uniquement</option>
            </select>
          </div>
          <div class="field">
            <label for="f-city">Ville</label>
            <select class="select" id="f-city"><option value="">Toutes</option></select>
          </div>
          <div class="field">
            <label for="f-denom">Sensibilité d'église</label>
            <select class="select" id="f-denom"><option value="">Toutes</option></select>
          </div>
          <div class="field-row" style="grid-template-columns:1fr 1fr">
            <div class="field"><label for="f-min">Âge min.</label><input class="input" type="number" id="f-min" min="18" max="99" value="18"></div>
            <div class="field"><label for="f-max">Âge max.</label><input class="input" type="number" id="f-max" min="18" max="99" value="60"></div>
          </div>
          <fieldset class="field">
            <legend>Forte convergence sur</legend>
            <div class="choice-group" id="f-conv"></div>
          </fieldset>
          <button type="reset" class="btn btn--ghost btn--sm btn--block">Réinitialiser</button>
        </form>
      </aside>

      <section>
        <div class="toolbar">
          <p class="mb-0" id="count" aria-live="polite"></p>
          <div class="flex">
            <label for="sort" class="small muted">Trier par</label>
            <select class="select" id="sort" style="width:auto">
              <option value="relevance">Pertinence</option>
              <option value="age">Âge</option>
              <option value="city">Ville</option>
            </select>
          </div>
        </div>
        <div class="grid grid--cards" id="results"></div>
        <p class="small muted" style="margin-top:24px">L’ordre « Pertinence » s’appuie sur un score interne indicatif. Il ne prend jamais seul de décision : <a href="#/transparence">en savoir plus</a>.</p>
      </section>
    </div>
  </div>
`,
  init(ctx) {
  const $ = id => document.getElementById(id);
  const results = $("results");
  const form = $("filters");

  const state0 = Store.read();
  if (state0.user.status !== "actif") {
    document.querySelector(".search-layout").innerHTML = `
      <div class="card card--soft empty" style="grid-column:1/-1">
        ${icon("lock", 40)}
        <h3>Recherche accessible après validation de votre profil</h3>
        <p>Votre référent d'église doit d'abord valider votre inscription.</p>
        <a class="btn btn--primary" href="#/tableau-de-bord">Voir mon statut</a>
      </div>`;
    return;
  }

  /* Options des filtres */
  const pool = CH.visibleProfiles(state0);
  [...new Set(pool.map(p => p.city))].sort().forEach(c => $("f-city").insertAdjacentHTML("beforeend", `<option>${c}</option>`));
  [...new Set(CH_DATA.churches.map(c => c.denomination))].sort().forEach(d => $("f-denom").insertAdjacentHTML("beforeend", `<option>${d}</option>`));
  ["Vision chrétienne", "Projet familial", "Valeurs", "Localisation", "Engagement"].forEach((d, i) =>
    $("f-conv").insertAdjacentHTML("beforeend", `<label class="choice"><input type="checkbox" value="${d}" id="cv${i}"><span>${d}</span></label>`));

  function render() {
    const s = Store.read();
    const city = $("f-city").value;
    const denom = $("f-denom").value;
    const min = Number($("f-min").value) || 18;
    const max = Number($("f-max").value) || 99;
    const mode = $("f-mode").value;
    const convs = [...$("f-conv").querySelectorAll("input:checked")].map(i => i.value);

    let list = CH.visibleProfiles(s).filter(p =>
      (!city || p.city === city) &&
      (!denom || CH.church(p.churchId).denomination === denom) &&
      p.age >= min && p.age <= max &&
      (mode !== "suggested" || p.suggested) &&
      convs.every(c => p.conv.some(([label, level]) => label === c && level === "forte"))
    );

    const sort = $("sort").value;
    list.sort((a, b) => sort === "age" ? a.age - b.age : sort === "city" ? a.city.localeCompare(b.city) : b.score - a.score);

    $("count").innerHTML = `<strong>${list.length}</strong> profil${list.length > 1 ? "s" : ""} validé${list.length > 1 ? "s" : ""}`;
    results.innerHTML = list.length
      ? list.map(p => renderProfileCard(p, s)).join("")
      : `<div class="empty" style="grid-column:1/-1">${icon("search", 40)}<p>Aucun profil ne correspond à ces critères.</p></div>`;
  }

  form.addEventListener("input", render);
  form.addEventListener("reset", () => setTimeout(render));
  $("sort").addEventListener("change", render);
  bindProfileActions(results, render);
  render();
  }
});
