/* =========================================================
   CHEMINONS — Fil de polaroïds
   Des tirages accrochés par une pince à un fil qui s'affaisse.
   On fait glisser le fil (ou flèches, clic sur un tirage, ←/→) :
   les tirages se balancent selon la vitesse donnée, puis se posent
   avec un léger dépassement. Celui du centre est l'étape affichée.

   polaroidLine(root, slides, options) → fonction de nettoyage
   slides : [{ title, caption, label, icon, palette, seed, image, alt }]
   `image` : photo du tirage ; sans elle, un paysage est peint au canvas.
   ========================================================= */

(function () {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = n => (n < 10 ? "0" + n : String(n));

  /* Fil affaissé de `sag` px entre (0, y0) et (w, y0), hauteur en x */
  const stringY = (x, w, y0, sag) => { const t = clamp(x / w, 0, 1); return y0 + 4 * sag * t * (1 - t); };

  /* Ressort amorti critique vers la cible */
  function springStep(x, v, target, dt, k = 70) {
    const c = 2 * Math.sqrt(k);
    const nv = v + (k * (target - x) - c * v) * dt;
    return [x + nv * dt, nv];
  }

  /* Balancement d'un tirage : il traîne derrière le mouvement, la pesanteur le ramène */
  function swingStep(a, w, lineVel, dt, gain) {
    const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt;
    return [clamp(a + nw * dt, -0.6, 0.6), nw];
  }

  const nearestAt = (off, spacing, n) => clamp(Math.round(off / spacing), 0, Math.max(0, n - 1));

  /* ---------- Paysages peints (une fois, puis mis en cache) ---------- */
  const PALETTES = {
    dawn: { top: "#e7b7a5", bottom: "#f8e8d6", sun: "#fff4df", far: "#d2b2bb", near: "#3a2a3b", mist: "255,240,232" },
    alpine: { top: "#7ea5c8", bottom: "#e3ecf2", sun: "#ffffff", far: "#a9bfd0", near: "#1c3044", mist: "236,244,250" },
    dusk: { top: "#2a2450", bottom: "#ef8d60", sun: "#ffd9a6", far: "#93607c", near: "#18121f", mist: "255,196,160" },
    mist: { top: "#c4d0cb", bottom: "#eef1ec", sun: "#ffffff", far: "#aebcb5", near: "#2c3a33", mist: "246,248,245" }
  };
  const cache = {};

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hexRgb(h) { const v = parseInt(h.replace("#", ""), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function mixRgb(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"; }

  /* Ciel, soleil bas, cinq crêtes dans la brume, ligne d'arbres, grain */
  function paintLandscape(seed, palette, w = 640, h = 640) {
    const key = palette + ":" + seed;
    if (cache[key]) return cache[key];
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    if (!g) return "";
    const P = PALETTES[palette] || PALETTES.dawn;
    const r = mulberry32(seed * 104729 + 7);
    const sun = hexRgb(P.sun).join(",");

    const sky = g.createLinearGradient(0, 0, 0, h * 0.72);
    sky.addColorStop(0, P.top); sky.addColorStop(1, P.bottom);
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const sx = w * (0.22 + r() * 0.56), sy = h * (0.22 + r() * 0.14);
    const halo = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45);
    halo.addColorStop(0, "rgba(" + sun + ",.85)");
    halo.addColorStop(0.08, "rgba(" + sun + ",.55)");
    halo.addColorStop(1, "rgba(" + sun + ",0)");
    g.fillStyle = halo; g.fillRect(0, 0, w, h);
    g.fillStyle = P.sun; g.beginPath(); g.arc(sx, sy, h * 0.045, 0, Math.PI * 2); g.fill();

    const layers = 5;
    for (let L = 0; L < layers; L++) {
      const k = L / (layers - 1);
      const base = h * (0.42 + k * 0.4), amp = h * (0.07 + k * 0.1);
      const ph = [r(), r(), r(), r()].map(v => v * Math.PI * 2);
      const fr = [1.3 + r(), 3.1 + r() * 2, 7 + r() * 4, 17 + r() * 8];
      const ridge = x => {
        const u = x / w;
        return base - amp * (0.55 * Math.sin(u * fr[0] + ph[0]) + 0.28 * Math.sin(u * fr[1] + ph[1])
          + 0.12 * Math.abs(Math.sin(u * fr[2] + ph[2])) + 0.05 * Math.sin(u * fr[3] + ph[3]));
      };
      const mist = g.createLinearGradient(0, base - amp * 1.4, 0, base + amp * 0.4);
      mist.addColorStop(0, "rgba(" + P.mist + ",0)");
      mist.addColorStop(1, "rgba(" + P.mist + "," + (0.55 - k * 0.35).toFixed(2) + ")");
      g.fillStyle = mist; g.fillRect(0, base - amp * 1.4, w, amp * 1.8);
      const body = g.createLinearGradient(0, base - amp, 0, h);
      body.addColorStop(0, mixRgb(P.far, P.near, Math.pow(k, 1.3)));
      body.addColorStop(1, mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.18)));
      g.fillStyle = body;
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) g.lineTo(x, ridge(x));
      g.lineTo(w, h); g.closePath(); g.fill();
      if (L >= layers - 2) {
        g.fillStyle = mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.08));
        for (let x = 0; x < w; x += 5 + r() * 7) {
          if (r() < 0.35) continue;
          const y = ridge(x) + 2, th = h * (0.025 + r() * 0.035) * (0.6 + k), tw = th * 0.32;
          g.beginPath(); g.moveTo(x, y - th); g.lineTo(x + tw, y); g.lineTo(x - tw, y); g.closePath(); g.fill();
        }
      }
    }

    const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h / 2, w * 0.78);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,.32)");
    g.fillStyle = vig; g.fillRect(0, 0, w, h);
    const grain = g.getImageData(0, 0, w, h), d = grain.data;
    for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 14; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    g.putImageData(grain, 0, 0);
    return (cache[key] = c.toDataURL("image/jpeg", 0.86));
  }

  /* ---------- Composant ---------- */
  window.polaroidLine = function (root, slides, options = {}) {
    const opts = { cardWidth: 250, sag: 40, swing: 1, autoplay: 5000, label: "Carrousel", onChange: null, ...options };
    const n = slides.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.classList.add("pl");
    root.innerHTML = `
      <div class="pl__stage" tabindex="0" role="region" aria-roledescription="carrousel" aria-label="${opts.label}">
        <svg class="pl__string" aria-hidden="true"><path fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
        ${slides.map((s, i) => `
          <div class="pl__card" data-i="${i}" data-on="0" aria-hidden="true">
            <div class="pl__print">
              <div class="pl__shot">
                ${s.image
                  ? `<img src="${s.image}" alt="${s.alt || ""}" draggable="false" loading="lazy" decoding="async" width="640" height="640">`
                  : `<img alt="" draggable="false" hidden>`}
                ${s.icon ? `<span class="pl__badge">${icon(s.icon, 18)}</span>` : ""}
                ${s.label ? `<span class="pl__label">${s.label}</span>` : ""}
              </div>
              <div class="pl__note">${s.title || ""}</div>
            </div>
            <div class="pl__peg"></div>
          </div>`).join("")}
      </div>
      <div class="pl__bar">
        <div class="pl__cap" aria-hidden="true"></div>
        <span class="pl__count" aria-hidden="true"></span>
        <div class="pl__arrows">
          <button type="button" class="pl__btn" data-step="-1" aria-label="Étape précédente">${icon("back", 18)}</button>
          <button type="button" class="pl__btn" data-step="1" aria-label="Étape suivante">${icon("arrow", 18)}</button>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>`;

    const stage = root.querySelector(".pl__stage");
    const path = root.querySelector(".pl__string path");
    const cards = [...root.querySelectorAll(".pl__card")];
    const cap = root.querySelector(".pl__cap");
    const count = root.querySelector(".pl__count");
    const live = root.querySelector("[aria-live]");
    const [prevBtn, nextBtn] = root.querySelectorAll(".pl__btn");

    const S = { off: 0, vel: 0, target: 0, a: [], w: [] };
    let size = { w: 1000, h: 480, cw: opts.cardWidth };
    let spacing = size.cw * 1.08;
    let active = -1, drag = null, lastTouch = 0, visible = true, raf = 0, prev = performance.now();
    let paintTimer = 0;

    /* Peinture des images une à une pour ne pas bloquer le fil principal */
    let painted = 0;
    (function paintNext() {
      if (painted >= n) return;
      const s = slides[painted];
      if (!s.image) {
        const img = cards[painted].querySelector("img");
        img.src = paintLandscape(s.seed ?? painted + 1, s.palette || "dawn");
        img.hidden = false;
      }
      painted++;
      paintTimer = setTimeout(paintNext, 16);
    })();

    function setActive(i) {
      if (i === active) return;
      active = i;
      const s = slides[i];
      cards.forEach((c, k) => {
        c.dataset.on = k === i ? "1" : "0";
        c.setAttribute("aria-hidden", k === i ? "false" : "true");
      });
      cap.innerHTML = `
        ${s.kicker ? `<span class="pl__kicker">${s.kicker}</span>` : ""}
        <span class="pl__title">${s.title || ""}</span>
        ${s.caption ? `<span class="pl__sub">${s.caption}</span>` : ""}`;
      count.innerHTML = `<b>${pad2(i + 1)}</b> / ${pad2(n)}`;
      live.textContent = `Étape ${i + 1} sur ${n} : ${s.title || ""}`;
      if (opts.onChange) opts.onChange(i);
    }

    function goTo(i) {
      i = clamp(i, 0, n - 1);
      S.target = i * spacing;
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === n - 1;
      if (reduce) { S.off = S.target; S.vel = 0; }
      wake();
    }

    function measure() {
      const r = stage.getBoundingClientRect();
      const cw = Math.round(Math.max(140, Math.min(opts.cardWidth, r.width * 0.42, r.height * 0.5)));
      const idx = Math.max(0, active);
      size = { w: r.width, h: r.height, cw };
      spacing = cw * 1.08;
      root.style.setProperty("--pl-cw", cw + "px");
      S.target = S.off = idx * spacing;
      wake();
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const { w, h, cw } = size;
      const y0 = Math.max(28, h * 0.1);
      let lineVel;
      if (drag && drag.moved) {
        lineVel = drag.v * 1000;
      } else {
        const before = S.off;
        [S.off, S.vel] = springStep(S.off, S.vel, S.target, dt);
        lineVel = -(S.off - before) / Math.max(dt, 1e-3);
      }
      const gain = reduce ? 0 : opts.swing;
      const near = nearestAt(S.off, spacing, n);
      for (let i = 0; i < n; i++) {
        const el = cards[i];
        const x = w / 2 + i * spacing - S.off;
        if (x < -cw * 1.5 || x > w + cw * 1.5) { el.style.visibility = "hidden"; continue; }
        el.style.visibility = "visible";
        let a = S.a[i] || 0, av = S.w[i] || 0;
        [a, av] = swingStep(a, av, lineVel, dt, gain);
        if (gain) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * gain;
        S.a[i] = a; S.w[i] = av;
        const y = stringY(x, w, y0, opts.sag) - 6;
        el.style.transform = `translate(${(x - cw / 2).toFixed(1)}px,${y.toFixed(1)}px) rotate(${a.toFixed(4)}rad)`;
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near));
      }
      path.setAttribute("d", `M0 ${y0} Q${w / 2} ${y0 + 2 * opts.sag} ${w} ${y0}`);
      setActive(near);
      /* Au repos et sans brise (mouvement réduit) : on arrête la boucle */
      if (reduce && !drag && Math.abs(S.off - S.target) < 0.5) return;
      raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (!raf && visible) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    }

    /* Glisser le fil */
    stage.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      lastTouch = performance.now();
      drag = { x: e.clientX, off: S.off, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
    });
    stage.addEventListener("pointermove", e => {
      const d = drag;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 5) {
        d.moved = true;
        stage.dataset.drag = "1";
        stage.setPointerCapture(e.pointerId);
      }
      if (!d.moved) return;
      const dt = Math.max(1, e.timeStamp - d.lt);
      d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v;
      d.lx = e.clientX; d.lt = e.timeStamp;
      const max = (n - 1) * spacing;
      let off = d.off - dx;
      if (off < 0) off *= 0.35;
      if (off > max) off = max + (off - max) * 0.35;
      S.off = off;
      wake();
    });
    const release = e => {
      const d = drag;
      drag = null;
      lastTouch = performance.now();
      if (!d) return;
      if (d.moved) {
        stage.dataset.drag = "0";
        S.vel = -d.v * 1000;
        goTo(nearestAt(S.off - d.v * 180, spacing, n));
        return;
      }
      const card = e.target.closest("[data-i]");
      if (card) goTo(Number(card.dataset.i));
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    const step = dir => { lastTouch = performance.now(); goTo(Math.round(S.target / spacing) + dir); };
    stage.addEventListener("keydown", e => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(n - 1);
      else if (e.key in keys) step(keys[e.key]);
      else return;
      lastTouch = performance.now();
      e.preventDefault();
    });
    root.querySelector(".pl__arrows").addEventListener("click", e => {
      const b = e.target.closest("[data-step]");
      if (b) step(Number(b.dataset.step));
    });

    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); });
    io.observe(root);

    /* Défilement automatique : en pause pendant une interaction ou quand le focus est dans le carrousel */
    let timer = 0;
    if (opts.autoplay && n > 1 && !reduce) {
      timer = setInterval(() => {
        if (document.hidden || drag || !visible || root.contains(document.activeElement)
          || performance.now() - lastTouch < opts.autoplay) return;
        goTo(active >= n - 1 ? 0 : active + 1);
      }, opts.autoplay);
    }

    measure();
    goTo(0);
    setActive(0);

    return {
      goTo: i => { lastTouch = performance.now(); goTo(i); },
      destroy() {
        cancelAnimationFrame(raf);
        clearInterval(timer);
        clearTimeout(paintTimer);
        ro.disconnect();
        io.disconnect();
      }
    };
  };
})();
