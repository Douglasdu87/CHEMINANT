/* Vue « Accueil » — #/ */
/* Contenu de la feuille déchirée : identique dans les deux moitiés, chacune n'en montre qu'un côté */
const tearPage = () => `
  <div class="tear__page">
    <img class="tear__logo" src="public/logo-cheminons.png" alt="" width="240" height="170">
    <p class="kicker">Une page s'ouvre</p>
    <p class="tear__headline">Votre histoire commence <em>ici</em>.</p>
    <p class="tear__hint"><i data-icon="arrow" data-size="16"></i> Faites défiler pour découvrir</p>
  </div>`;

/* Confettis de l'ouverture : petits papiers aux couleurs du logo qui jaillissent
   du pourtour de l'orbite, tournoient et retombent doucement. */
function orbitConfetti(canvas, host) {
  const ctx2d = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const colors = ["--color-primary", "--color-gold", "--color-gold-bright", "--color-gold-soft", "--color-primary"]
    .map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  let parts = [], w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0, drizzle = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const piece = (x, y, vx, vy) => ({
    x, y, vx, vy,
    size: 5 + Math.random() * 6,
    ratio: Math.random() < .3 ? 1 : .45,          // carrés et rubans
    round: Math.random() < .2,                     // quelques pastilles
    rot: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * 0.2,
    flip: Math.random() * Math.PI * 2, vf: 0.08 + Math.random() * 0.12,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0, ttl: 220 + Math.random() * 140
  });
  const burst = (count = 70) => {
    if (!w) resize();
    const cx = w / 2, cy = h * .46, radius = Math.min(w, h) * .42;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      parts.push(piece(cx + Math.cos(a) * radius * .55, cy + Math.sin(a) * radius * .55,
        Math.cos(a) * speed, Math.sin(a) * speed - 3));
    }
    loop();
  };
  const tick = (t) => {
    raf = 0;
    const dt = Math.min((t - (last || t)) / 16.7, 3); last = t;
    ctx2d.clearRect(0, 0, w, h);
    // Pluie légère et continue autour des photos
    drizzle += dt;
    if (drizzle > 14 && parts.length < 160) {
      drizzle = 0;
      parts.push(piece(w * (.1 + Math.random() * .8), -10, (Math.random() - .5) * .6, 0.4 + Math.random() * .6));
    }
    parts = parts.filter((p) => {
      p.life += dt;
      p.vx *= Math.pow(.985, dt); p.vy = p.vy * Math.pow(.985, dt) + .07 * dt;
      p.vy = Math.min(p.vy, 2.4);
      p.x += (p.vx + Math.sin(p.life / 18) * .35) * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vf * dt;
      const fade = Math.min(1, (p.ttl - p.life) / 40);
      if (fade <= 0 || p.y > h + 20) return false;
      ctx2d.save();
      ctx2d.globalAlpha = fade * .9;
      ctx2d.translate(p.x, p.y); ctx2d.rotate(p.rot); ctx2d.scale(1, Math.cos(p.flip));
      ctx2d.fillStyle = p.color;
      if (p.round) { ctx2d.beginPath(); ctx2d.arc(0, 0, p.size * .4, 0, Math.PI * 2); ctx2d.fill(); }
      else ctx2d.fillRect(-p.size / 2, -p.size * p.ratio / 2, p.size, p.size * p.ratio);
      ctx2d.restore();
      return true;
    });
    loop();
  };
  const loop = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); };

  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = 0; loop(); });
  io.observe(host);
  const onVis = () => { last = 0; loop(); };
  document.addEventListener("visibilitychange", onVis);
  resize();
  return {
    burst,
    stop() { cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); parts = []; }
  };
}

App.view("accueil", {
  layout: "public",
  title: "Accueil",
  template: () => `
  <!-- DÉCHIRURE : une feuille ivoire se déchire au défilement et dévoile le couple -->
  <section class="tear" data-tear aria-labelledby="tear-title">
    <div class="tear__sticky">
      <figure class="tear__scene">
        <video class="tear__photo" data-tear-photo src="public/image-header.mp4" autoplay muted loop playsinline preload="auto" aria-label="Un couple en tenue de cérémonie se tenant la main et se regardant en souriant"></video>
        <figcaption class="tear__inside" data-tear-inside>
          <div class="container">
            <p class="kicker kicker--light">Rencontre · Discernement · Mariage</p>
            <h2 class="tear__title" id="tear-title">Votre conjoint de destinée vous attend peut-être ici</h2>
            <a class="btn btn--primary btn--lg" href="#/inscription">Commencer mon cheminement <i data-icon="arrow" data-size="18"></i></a>
          </div>
        </figcaption>
      </figure>

      <div class="tear__half tear__half--left" data-tear-half="left" aria-hidden="true">
        <div class="tear__fiber"></div>
        <div class="tear__paper">${tearPage()}</div>
      </div>
      <div class="tear__half tear__half--right" data-tear-half="right" aria-hidden="true">
        <div class="tear__fiber"></div>
        <div class="tear__paper">${tearPage()}</div>
      </div>
    </div>
  </section>

  <!-- OUVERTURE -->
  <section class="hero">
    <div class="container hero__grid">
      <div class="hero__text">
        <p class="kicker">Votre conjoint de destinée vous attend peut-être ici</p>
        <h1>Une rencontre sérieuse, <em>portée</em> par votre communauté.</h1>
        <p class="lead">Cheminons accompagne les hommes et les femmes chrétiens qui souhaitent construire une relation orientée vers le mariage. Chaque profil est rencontré puis validé par un référent de son église.</p>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#/inscription">Commencer mon cheminement <i data-icon="arrow" data-size="18"></i></a>
          <a class="btn btn--ghost btn--lg" href="#/accueil/parcours">Voir le parcours</a>
        </div>
        <ul class="hero__facts">
          <li><i data-icon="shield" data-size="16"></i> Profils validés par un référent</li>
          <li><i data-icon="users" data-size="16"></i> Échanges après intérêt réciproque</li>
          <li><i data-icon="book" data-size="16"></i> École du mariage pour les couples engagés</li>
        </ul>
      </div>

      <div class="orbit" data-orbit>
        <svg class="orbit__rings" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
          <g class="orbit__ring orbit__ring--outer">
            <circle cx="300" cy="300" r="290" />
            <circle class="orbit__bead" cx="300" cy="10" r="5" />
          </g>
          <g class="orbit__ring orbit__ring--inner">
            <circle cx="300" cy="300" r="240" />
            <circle class="orbit__bead orbit__bead--soft" cx="60" cy="300" r="4" />
          </g>
        </svg>
        <canvas class="orbit__confetti" data-orbit-confetti aria-hidden="true"></canvas>
        <div class="orbit__stage">
          <div class="orbit__slide is-active" data-orbit-slide>
            <figure class="orbit__photo">
              <img src="public/hero-image.png" alt="Un jeune couple se tenant les mains et se regardant en souriant" width="1024" height="1536" loading="lazy" decoding="async">
            </figure>
          </div>
          <div class="orbit__slide" data-orbit-slide>
            <figure class="orbit__photo">
              <img src="public/image-header-removebg-preview.png" alt="Un couple en tenue de cérémonie se tenant la main" width="433" height="577" loading="lazy" decoding="async">
            </figure>
          </div>
        </div>
        <div class="orbit__nav">
          <button type="button" class="orbit__dot" data-orbit-go="0" aria-label="Afficher la première photo" aria-pressed="true"></button>
          <button type="button" class="orbit__dot" data-orbit-go="1" aria-label="Afficher la seconde photo" aria-pressed="false"></button>
        </div>
      </div>
    </div>
  </section>

  <!-- PRINCIPES -->
  <section class="principles" aria-labelledby="principles-title">
    <div class="container">
      <h2 class="sr-only" id="principles-title">Ce qui distingue Cheminons</h2>
      <div class="principles__grid">
        <article>
          <span class="principles__num">I</span>
          <h3>Validé par votre église</h3>
          <p>Un référent désigné par votre communauté vous rencontre avant l'activation de votre profil. Vous savez à qui vous parlez.</p>
        </article>
        <article>
          <span class="principles__num">II</span>
          <h3>Des convergences, pas un score</h3>
          <p>Foi, vision du mariage, projet familial, lieu de vie : nous montrons ce qui vous rapproche et ce qui reste à discuter.</p>
        </article>
        <article>
          <span class="principles__num">III</span>
          <h3>Orienté vers le mariage</h3>
          <p>Après trois mois d'échange, si vous décidez d'avancer ensemble, le parcours continue : formation, accompagnement pastoral, préparation à l'alliance.</p>
        </article>
      </div>
    </div>
  </section>

  <!-- PARCOURS -->
  <section class="section section--dark" id="parcours">
    <div class="container">
      <div class="section__head">
        <p class="kicker kicker--light">Le parcours complet</p>
        <h2>De l'inscription jusqu'à l'alliance, en quinze étapes</h2>
        <p class="section__intro">Chaque étape a son rythme. Vous avancez à votre pas, entouré·e par votre communauté.</p>
      </div>
      <div class="path" id="road"></div>
    </div>
  </section>

  <!-- VALIDATION -->
  <section class="section" id="validation">
    <div class="container split">
      <div class="text-justify">
        <p class="kicker">Notre particularité</p>
        <h2>Zéro faux profils, zéro arnaques… On gère tout. Toi, concentre-toi sur ta recherche.</h2>
        <p class="lead">À l'inscription, vous vous rattachez à votre église locale. Un référent désigné par celle-ci vous reçoit pour un entretien, puis valide votre profil.</p>
        <ul class="checks">
          <li><span><strong>Un entretien bienveillant</strong> pour vous connaître, comprendre votre démarche et vous encourager.</span></li>
          <li><span><strong>Une communauté qui vous porte</strong> : votre référent peut être informé lorsque vous décidez d'avancer en couple.</span></li>
          <li><span><strong>Discrétion et respect</strong> : les échanges avec votre référent restent confidentiels.</span></li>
        </ul>
        <div class="flex">
          <a class="btn btn--primary" href="#/inscription">Rejoindre Cheminons</a>
          <a class="btn btn--ghost" href="#/eglise-partenaire">Inscrire mon église</a>
        </div>
      </div>
      <div class="validation-visual glow-card" data-glow aria-label="Étapes de validation">
        <div class="vstep is-done"><div class="vstep__icon"><i data-icon="check" data-size="16"></i></div><div><strong>Inscription</strong><span>Profil complété</span></div></div>
        <div class="vstep is-done"><div class="vstep__icon"><i data-icon="check" data-size="16"></i></div><div><strong>Mon Église</strong><span>Rattachement confirmé</span></div></div>
        <div class="vstep is-done"><div class="vstep__icon"><i data-icon="check" data-size="16"></i></div><div><strong>Entretien avec le pasteur</strong><span>Réalisé le 3 octobre</span></div></div>
        <div class="vstep is-active"><div class="vstep__icon"><i data-icon="shield" data-size="16"></i></div><div><strong>Profil activé</strong><span>Vous pouvez découvrir des profils</span></div></div>
      </div>
    </div>
  </section>

  <!-- MISE EN RELATION -->
  <section class="section section--alt">
    <div class="container">
      <div class="section__head">
        <p class="kicker">Mise en relation</p>
        <h2>Le double intérêt, pour une rencontre sereine</h2>
        <p class="lead">La messagerie est réservée aux membres validés par leur église et à jour de leur formule. L'intérêt réciproque ouvre ensuite un espace à deux, et trois mois d'échange précèdent toute entrée dans le parcours Cheminons.</p>
      </div>
      <ol class="steps-line">
        <li><span class="steps-line__num">1</span><h3>Découvrir</h3><p>Explorez les profils ou recevez des suggestions lorsque plusieurs éléments de vos projets de vie convergent.</p></li>
        <li><span class="steps-line__num">2</span><h3>Manifester son intérêt</h3><p>Consultez une fiche, manifestez votre intérêt, passez, ou demandez conseil à votre référent.</p></li>
        <li><span class="steps-line__num">3</span><h3>Intérêt réciproque</h3><p>L'intérêt est partagé : vous êtes mis en relation, et vos trois mois d'échange commencent.</p></li>
        <li><span class="steps-line__num">4</span><h3>Notre cheminement</h3><p>Un espace à deux pour se connaître, prier et discerner. Après trois mois, chacun peut activer le parcours Cheminons depuis son profil.</p></li>
      </ol>
    </div>
  </section>

  <!-- ÉCOLE (module activé pour les couples en cheminement : aucun contenu de cours ici) -->
  <section class="section" id="ecole">
    <div class="container split">
      <div>
        <p class="kicker">École du mariage</p>
        <h2>Une formation qui s'ouvre après trois mois d'échange</h2>
        <p class="lead">L'École du mariage n'est pas en libre accès. Trois mois d'échange sur Cheminons permettent d'abord d'apprendre à se connaître et d'éprouver la relation. Ensuite, chacun active le parcours Cheminons depuis son profil : l'École du mariage s'ouvre quand vous l'avez activé tous les deux, et se suit à votre rythme, avec votre référent.</p>
        <p class="small muted">Contenus élaborés avec des responsables pastoraux et, pour les sujets spécialisés, des professionnels compétents.</p>
      </div>
      <div class="school-card glow-card" data-glow>
        <div class="school-card__head">
          <span class="locked__icon"><i data-icon="lock" data-size="22"></i></span>
          <div><strong>Module réservé</strong><span>Aux couples en cheminement</span></div>
        </div>
        <ul class="school-card__facts">
          <li><strong id="school-count"></strong><span>modules progressifs</span></li>
          <li><strong id="school-formats"></strong><span>formats par module</span></li>
          <li><strong>À deux</strong><span>avec votre référent</span></li>
        </ul>
        <div class="school-card__badges" id="school-badges"></div>
        <p class="school-card__unlock"><i data-icon="ring" data-size="16"></i><span>Activation à l'étape <strong id="school-step"></strong>, après trois mois d'échange et l'accord de chacun.</span></p>
      </div>
    </div>
  </section>

  <!-- VERSET -->
  <section class="verse-band">
    <div class="container">
      <blockquote class="verse">
        <p>« Deux valent mieux qu'un… et la corde à trois fils ne se rompt pas facilement. »</p>
        <cite>Ecclésiaste 4.9-12</cite>
      </blockquote>
    </div>
  </section>

  <!-- TÉMOIGNAGES -->
  <section class="section">
    <div class="container">
      <div class="section__head">
        <p class="kicker">Ils ont cheminé</p>
        <h2>Des histoires qui commencent bien</h2>
      </div>
      <div class="quotes">
        <figure class="quote">
          <blockquote>« Savoir que Ruth avait été rencontrée par son pasteur m'a mis en confiance dès le départ. »</blockquote>
          <figcaption><span class="avatar avatar--sm" style="--a1:#2d5877;--a2:#3f6b4f" aria-hidden="true">J</span><span><strong>Jonathan</strong>En cheminement depuis juillet</span></figcaption>
        </figure>
        <figure class="quote">
          <blockquote>« L'espace “Notre cheminement” nous a aidés à aborder des sujets que nous n'aurions pas osé évoquer si tôt. »</blockquote>
          <figcaption><span class="avatar avatar--sm" style="--a1:#8e1322;--a2:#c06c84" aria-hidden="true">A</span><span><strong>Anne et Mathieu</strong>Mariés en juin 2026</span></figcaption>
        </figure>
        <figure class="quote">
          <blockquote>« Le module sur l'argent a été une vraie découverte. Nous avons construit notre premier budget ensemble. »</blockquote>
          <figcaption><span class="avatar avatar--sm" style="--a1:#9c7a3c;--a2:#b5191f" aria-hidden="true">E</span><span><strong>Esther et Paul</strong>Fiancés</span></figcaption>
        </figure>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="section section--alt" id="faq">
    <div class="container faq-layout">
      <div>
        <p class="kicker">Questions fréquentes</p>
        <h2>Ce que l'on nous demande souvent</h2>
        <p class="muted">Une autre question ? Votre référent d'église est votre premier interlocuteur.</p>
      </div>
      <div class="faq">
        <details><summary>Mon église doit-elle être partenaire de Cheminons ?</summary><p>Oui. La validation par un référent est au cœur de Cheminons. Si votre église n'est pas encore partenaire, signalez-la lors de l'inscription : nous prendrons contact avec elle.</p></details>
        <details><summary>Qui est le référent ?</summary><p>Une personne désignée par votre église : pasteur, prêtre, ancien, responsable de pastorale… Elle vous rencontre lors d'un entretien puis valide, ou non, votre profil.</p></details>
        <details><summary>Comment fonctionne la compatibilité ?</summary><p>Un score interne est calculé à partir de vos réponses, mais nous vous présentons surtout des points de convergence. Le score ne prend jamais seul une décision vous concernant. <a href="#/transparence">En savoir plus</a></p></details>
        <details><summary>Puis-je écrire à n'importe qui ?</summary><p>Vous pouvez écrire aux membres validés par leur église et à jour de leur formule. Chaque échange suit une charte de bienveillance ; vous pouvez signaler ou bloquer un membre à tout moment, et votre référent en est informé.</p></details>
        <details><summary>Pourquoi attendre trois mois avant le parcours Cheminons ?</summary><p>Ce temps d'échange permet d'apprendre à se connaître en vérité et d'éprouver la relation avant de s'engager. Au terme des trois mois, chacun active le parcours depuis son profil ; il ne s'ouvre, avec l'École du mariage, que lorsque les deux l'ont fait.</p></details>
        <details><summary>Que se passe-t-il si mon profil n'est pas validé ?</summary><p>Votre référent peut demander des informations complémentaires ou mettre la demande en attente. En cas de décision négative, les raisons sont traitées avec discrétion et vous pouvez en parler directement avec lui.</p></details>
        <details><summary>L'École du mariage est-elle obligatoire ?</summary><p>Elle est proposée aux couples qui, après trois mois d'échange sur Cheminons, décident tous les deux d'avancer ensemble. Elle se suit à votre rythme, avec un accompagnement pastoral.</p></details>
      </div>
    </div>
  </section>

  <!-- TARIFS -->
  <section class="section pricing" id="tarifs">
    <div class="container">
      <div class="section__head section__head--center">
        <p class="kicker">Tarifs</p>
        <h2>Une participation adaptée à votre région</h2>
        <p class="lead">Deux formules au choix : SINGLE au mois, ou CHEMINONS au trimestre, plus avantageuse. Le tarif appliqué dépend de votre pays de résidence, et rien n'est payé avant la validation de votre candidature par votre référent.</p>
      </div>
      <div class="pricing__regions" id="pricing"></div>
    </div>
  </section>

  <!-- APPEL -->
  <section class="closing">
    <div class="container closing__inner">
      <img class="closing__logo" src="public/logo-cheminons.png" alt="" width="240" height="170" loading="lazy">
      <h2>Votre cheminement commence ici</h2>
      <p>Inscrivez-vous, rattachez-vous à votre église et laissez-vous accompagner vers une relation qui a du sens.</p>
      <a class="btn btn--primary btn--lg" href="#/inscription">Créer mon profil</a>
    </div>
  </section>
`,
  init(ctx) {
    /* Déchirure : au défilement, les deux moitiés de la feuille s'écartent le long
       d'un bord irrégulier et dévoilent la photo ; en remontant, la page se referme. */
    const tear = document.querySelector("[data-tear]");
    if (tear) {
      const sticky = tear.querySelector(".tear__sticky");
      const left = tear.querySelector('[data-tear-half="left"]');
      const right = tear.querySelector('[data-tear-half="right"]');
      const photo = tear.querySelector("[data-tear-photo]");
      const inside = tear.querySelector("[data-tear-inside]");
      const fibers = tear.querySelectorAll(".tear__fiber");
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let frame = 0;

      // Bord déchiré : une ligne brisée pseudo-aléatoire (graine fixe, même tracé à chaque visite)
      let seed = 7;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const edge = [];
      for (let y = 0, x = 50; y <= 100; y += 1.6 + rand() * 2.2) {
        x = Math.min(56, Math.max(44, x + (rand() - 0.5) * 3.2));
        edge.push([x, Math.min(100, y)]);
      }
      edge[edge.length - 1][1] = 100;
      // La fibre blanche dépasse un peu du papier, avec son propre grain
      const line = (dx, jitter) => edge.map(([x, y]) => `calc(${x}% + ${(dx + (jitter ? (rand() - 0.3) * jitter : 0)).toFixed(1)}px) ${y}%`).join(", ");
      const clip = (side, dx, jitter) => side === "left"
        ? `polygon(0 0, ${line(dx, jitter)}, 0 100%)`
        : `polygon(100% 0, ${line(-dx, jitter)}, 100% 100%)`;
      // La moitié gauche passe 2 px sous la droite : aucune jointure visible au repos
      left.querySelector(".tear__paper").style.clipPath = clip("left", 2, 0);
      left.querySelector(".tear__fiber").style.clipPath = clip("left", 5, 6);
      right.querySelector(".tear__paper").style.clipPath = clip("right", 0, 0);
      right.querySelector(".tear__fiber").style.clipPath = clip("right", 5, 6);

      const stickTop = () => parseFloat(getComputedStyle(sticky).top) || 0;
      const progress = () => {
        if (calm) return 1;
        const travel = tear.offsetHeight - sticky.offsetHeight;
        const top = tear.getBoundingClientRect().top - stickTop();
        return travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 1;
      };
      const ease = (t) => t * t * (3 - 2 * t);

      const render = () => {
        frame = 0;
        const p = progress();
        // 0 → 0,25 : la déchirure s'amorce par le haut ; 0,25 → 0,85 : les moitiés s'écartent
        const start = ease(Math.min(1, p / 0.25));
        const open = ease(Math.min(1, Math.max(0, (p - 0.2) / 0.65)));
        const angle = 2.5 * start + 6 * open;
        const shift = 2 * start + 62 * open;
        left.style.transform = `translateX(${-shift}vw) rotate(${-angle}deg)`;
        right.style.transform = `translateX(${shift}vw) rotate(${angle}deg)`;
        // Feuille intacte au repos : les fibres n'apparaissent qu'une fois la déchirure amorcée
        const fiber = String(Math.min(1, start * 4));
        fibers.forEach((f) => { f.style.opacity = fiber; });
        const shade = `drop-shadow(0 12px 22px rgba(42, 26, 28, ${(0.28 * Math.min(1, start * 3)).toFixed(3)}))`;
        left.style.filter = right.style.filter = start > 0 ? shade : "none";
        const gone = open >= 0.999;
        left.style.visibility = right.style.visibility = gone ? "hidden" : "visible";
        photo.style.transform = `scale(${(1.14 - 0.14 * open).toFixed(4)})`;
        const reveal = Math.min(1, Math.max(0, (p - 0.7) / 0.2));
        inside.style.opacity = String(reveal);
        inside.classList.toggle("is-visible", reveal > 0.5);
      };
      const queue = () => { if (!frame) frame = requestAnimationFrame(render); };

      // Vidéo en boucle derrière la feuille ; image fixe si les animations sont réduites
      if (calm) photo.pause();
      if (calm) tear.classList.add("tear--calm");
      window.addEventListener("scroll", queue, { passive: true });
      window.addEventListener("resize", queue);
      render();
      ctx.onLeave(() => {
        window.removeEventListener("scroll", queue);
        window.removeEventListener("resize", queue);
        cancelAnimationFrame(frame);
      });
    }

    /* Cartes lumineuses (validation, École du mariage) */
    setupGlowCards();

    /* Ouverture : deux photos de couple se relaient,
       dévoilées en tache d'encre ; pause au survol et au focus. */
    const orbit = document.querySelector("[data-orbit]");
    if (orbit) {
      const slides = [...orbit.querySelectorAll("[data-orbit-slide]")];
      const dots = [...orbit.querySelectorAll("[data-orbit-go]")];
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let current = 0, timer = null, paused = false;
      let show = (n) => {
        current = (n + slides.length) % slides.length;
        slides.forEach((el, k) => {
          const on = k === current;
          el.classList.toggle("is-active", on);
          el.toggleAttribute("inert", !on);
          el.setAttribute("aria-hidden", String(!on));
        });
        dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === current)));
      };
      const start = () => { if (!calm && !timer) timer = setInterval(() => { if (!paused) show(current + 1); }, 6500); };
      const restart = () => { clearInterval(timer); timer = null; start(); };
      dots.forEach((d) => d.addEventListener("click", () => { show(Number(d.dataset.orbitGo)); restart(); }));
      orbit.addEventListener("mouseenter", () => { paused = true; });
      orbit.addEventListener("mouseleave", () => { paused = false; });
      orbit.addEventListener("focusin", () => { paused = true; });
      orbit.addEventListener("focusout", () => { paused = false; });
      /* Confettis autour des photos : une gerbe à l'ouverture et à chaque
         changement de photo, puis une pluie légère tant que l'ouverture est visible. */
      const canvas = orbit.querySelector("[data-orbit-confetti]");
      const confetti = !calm && canvas ? orbitConfetti(canvas, orbit) : null;
      const showSlide = show;
      show = (n) => { showSlide(n); if (confetti) confetti.burst(); };
      orbit.querySelector(".orbit__stage").addEventListener("click", () => { if (confetti) confetti.burst(); });
      show(0);
      start();
      ctx.onLeave(() => { clearInterval(timer); if (confetti) confetti.stop(); });
    }

    /* Parcours complet : quinze tirages accrochés à un fil, regroupés par phase */
    const PHASE_INFO = {
      "Validation": { with: "Avec votre référent", palette: "dawn" },
      "Rencontre": { with: "À votre rythme", palette: "alpine" },
      "Discernement": { with: "À deux, dans la prière", palette: "mist" },
      "Préparation": { with: "Avec un couple accompagnateur", palette: "dusk" }
    };
    const STEP_ICONS = {
      inscription: "pen", eglise: "church", validation: "shield", active: "check",
      recherche: "search", interet: "heart", reciproque: "users", relation: "chat",
      discernement: "pray", decision: "compass",
      parcours: "compass", ecole: "book", accompagnement: "hands", preparation: "calendar", mariage: "ring"
    };
    /* Photos des tirages ; les autres étapes gardent un paysage peint */
    const STEP_PHOTOS = {
      inscription: ["public/parcours/inscription.webp", "Un jeune homme crée son compte devant son ordinateur"],
      eglise: ["public/parcours/eglise.webp", "Une petite église sur la montagne au coucher du soleil"],
      validation: ["public/parcours/validation.webp", "Une candidate en entretien avec le référent de son église"],
      active: ["public/parcours/profil-active.webp", "Un clic sur un écran d'ordinateur pour activer le profil"],
      recherche: ["public/parcours/suggestions.webp", "La silhouette d'une femme devant une porte qui s'ouvre sur la lumière"],
      interet: ["public/parcours/interet.webp", "Un homme souriant en costume, prêt à faire le premier pas"],
      reciproque: ["public/parcours/interet-reciproque.webp", "Un homme et une femme se sourient, entourés de fleurs"],
      relation: ["public/parcours/mise-en-relation.webp", "Un couple en silhouette devant une porte qui s'ouvre sur la lumière"],
      discernement: ["public/parcours/discernement.webp", "Un homme et une femme marchent main dans la main sur un chemin"],
      decision: ["public/parcours/decision.webp", "Une femme serre tendrement son compagnon dans ses bras"],
      ecole: ["public/parcours/ecole.webp", "Un panneau « École du mariage » orné de deux alliances"],
      preparation: ["public/parcours/preparation.webp", "Un homme demande la main d'une jeune femme en tenue de fête"],
      accompagnement: ["public/parcours/accompagnement.webp", "Deux personnes marchent côte à côte, l'une posant la main sur l'épaule de l'autre"],
      mariage: ["public/parcours/mariage.webp", "Des mariés se sourient, l'alliance au doigt de la mariée"]
    };
    const total = CH_DATA.journey.length;
    const phases = [];
    CH_DATA.journey.forEach((step, i) => {
      let group = phases.find(p => p.name === step.phase);
      if (!group) phases.push(group = { name: step.phase, first: i, last: i });
      group.last = i;
    });
    const pad = n => String(n).padStart(2, "0");
    const road = document.getElementById("road");
    road.innerHTML = `
      <div class="path__phases" role="group" aria-label="Aller à une phase">
        ${phases.map((p, i) => `
          <button class="path__phase" type="button" data-first="${p.first}" aria-pressed="false">
            <span class="path__phase-num">${pad(i + 1)}</span> ${CH.escape(p.name)}
            <span class="path__phase-range">Étapes ${p.first + 1} à ${p.last + 1}</span>
          </button>`).join("")}
      </div>
      <div class="path__line"></div>
      <div class="path__foot">
        <a class="path__nav" href="#/inscription">Commencer mon cheminement ${icon("arrow", 16)}</a>
      </div>`;
    const phaseBtns = [...road.querySelectorAll(".path__phase")];
    const line = polaroidLine(road.querySelector(".path__line"), CH_DATA.journey.map((s, i) => ({
      title: s.title,
      caption: s.desc,
      kicker: `${s.phase} | ${PHASE_INFO[s.phase].with}`,
      label: `Étape ${pad(i + 1)}`,
      icon: STEP_ICONS[s.key] || "check",
      palette: PHASE_INFO[s.phase].palette,
      seed: i * 7 + 3,
      image: STEP_PHOTOS[s.key] && STEP_PHOTOS[s.key][0],
      alt: STEP_PHOTOS[s.key] && STEP_PHOTOS[s.key][1]
    })), {
      label: `Les ${total} étapes du parcours`,
      onChange: i => phaseBtns.forEach((b, k) => {
        const p = phases[k];
        b.setAttribute("aria-pressed", i >= p.first && i <= p.last);
      })
    });
    road.querySelector(".path__phases").addEventListener("click", e => {
      const b = e.target.closest("[data-first]");
      if (b) line.goTo(Number(b.dataset.first));
    });
    ctx.onLeave(() => line.destroy());

    /* Tarifs : SINGLE (mensuel) et CHEMINONS (trimestriel), en euros pour l'Europe et en francs CFA pour l'Afrique */
    document.getElementById("pricing").innerHTML = CH_DATA.pricing.map(r => `
      <section class="pricing__region" aria-labelledby="price-${r.region}">
        ${priceRegionHead(r.region, "price-" + r.region)}
        <div class="pricing__cards">
          ${Object.keys(r.plans).map(key => priceCard(r.region, key,
            `<a class="btn ${key === "cheminant" ? "btn--light" : "btn--primary"} btn--block" href="#/inscription?formule=${key}">Choisir ${CH_DATA.plans[key].name}</a>`)).join("")}
        </div>
      </section>`).join("");

    /* Tarifs animés : les cartes entrent l'une après l'autre quand la section apparaît,
       les montants défilent jusqu'au prix réel et un halo suit le pointeur sur chaque carte. */
    const pricing = document.getElementById("pricing");
    const priceCards = [...pricing.querySelectorAll(".price-card")];
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      priceCards.forEach((card, i) => card.style.setProperty("--pc-delay", `${i * 110}ms`));
      pricing.classList.add("is-animated");
      const countUp = (el, delay) => {
        const target = Number(el.dataset.amount), dur = 1100;
        const cents = Number.isInteger(target) ? 0 : 2;
        const fmt = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: cents, maximumFractionDigits: cents });
        let t0 = 0;
        el.textContent = fmt.format(0);
        const step = (t) => {
          if (!t0) t0 = t + delay;
          const k = Math.min(1, Math.max(0, (t - t0) / dur));
          el.textContent = fmt.format(k < 1 ? Math.round(target * (1 - Math.pow(1 - k, 3))) : target);
          if (k < 1) raf = requestAnimationFrame(step);
        };
        let raf = requestAnimationFrame(step);
        ctx.onLeave(() => cancelAnimationFrame(raf));
      };
      const seen = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        seen.disconnect();
        pricing.classList.add("is-in");
        const settle = setTimeout(() => pricing.classList.add("is-settled"), 700 + priceCards.length * 110);
        ctx.onLeave(() => clearTimeout(settle));
        priceCards.forEach((card, i) => countUp(card.querySelector(".price-card__value"), 250 + i * 110));
      }, { threshold: 0.2 });
      seen.observe(pricing);
      ctx.onLeave(() => seen.disconnect());
      priceCards.forEach((card) => card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }));
    }

    /* École du mariage : présentation du module, sans le contenu des cours */
    document.getElementById("school-count").textContent = CH_DATA.modules.length;
    document.getElementById("school-formats").textContent = CH_DATA.lessonFormats.length;
    document.getElementById("school-step").textContent = CH_DATA.journey.findIndex(j => j.key === "parcours") + 1;
    document.getElementById("school-badges").innerHTML = CH_DATA.lessonFormats
      .map(f => `<span class="badge">${icon(f.icon, 13)} ${f.label}</span>`).join("");
  }
});
