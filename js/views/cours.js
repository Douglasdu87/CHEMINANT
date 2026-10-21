/* Vue « Cours de l'École du mariage » — #/cours (administrateur)
   L'administrateur dépose les cours, module par module : un fichier MP3 (audio)
   ou MP4 (vidéo), un titre, l'intervenant et une courte description. Le fichier
   part directement dans le bucket privé « courses » (Api.admin.uploadCourseFile) ;
   les couples le lisent dans #/ecole, dans l'ordre fixé ici. */
const COURSE_MAX_BYTES = 50 * 1024 * 1024;   // limite par fichier de l'offre gratuite de Supabase

App.view("cours", {
  layout: "admin",
  title: "Cours de l'École du mariage",
  mainClass: "app-main",
  template: () => `
  <div class="container">
    <div class="page-head">
      <span class="eyebrow">Administration Cheminons</span>
      <div class="page-head__row">
        <h1>Cours de l'École du mariage</h1>
        <button class="btn btn--primary" type="button" id="btn-add">${icon("plus", 18)} Ajouter un cours</button>
      </div>
      <p class="muted mb-0" style="margin-top:10px;max-width:760px">Déposez les cours en audio (MP3) ou en vidéo (MP4), module par module. Les couples entrés dans le parcours Cheminons les suivent dans l'ordre affiché ici : un module s'ouvre quand le précédent a été suivi en entier.</p>
    </div>

    <div class="alert" style="margin-bottom:24px"><i data-icon="info"></i><p>Chaque fichier peut peser <strong>50&nbsp;Mo au plus</strong>. Pour une vidéo longue, exportez-la en 720p (ou compressez-la, par exemple avec HandBrake) avant de l'envoyer. Un module sans cours reste fermé aux couples, ainsi que les modules suivants.</p></div>
    ${Remote.on ? "" : `<div class="alert alert--gold" style="margin-bottom:24px"><i data-icon="info"></i><p>Mode démo : la liste montre les cours d'exemple. L'envoi de fichiers fonctionne une fois le site relié à Supabase.</p></div>`}

    <div class="stack" id="course-modules"></div>
  </div>

<!-- Modale : ajouter ou modifier un cours -->
<div class="modal" id="modal-course" role="dialog" aria-modal="true" aria-labelledby="course-title">
  <div class="modal__box modal__box--wide">
    <div class="modal__head">
      <h2 id="course-title" style="font-size:1.5rem">Ajouter un cours</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <form id="course-form" novalidate>
      <div class="field">
        <label for="course-module">Module</label>
        <select class="select" id="course-module">${CH_DATA.modules.map(m => `<option value="${m.id}">Module ${m.id} : ${m.title}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="course-name">Titre du cours</label>
        <input class="input" id="course-name" maxlength="160" required placeholder="Ex. Introduction : les fondements du mariage">
      </div>
      <div class="field">
        <label for="course-speaker">Intervenant <span class="muted">(facultatif)</span></label>
        <input class="input" id="course-speaker" maxlength="120" placeholder="Ex. Pasteur Daniel Moreau">
      </div>
      <div class="field">
        <label for="course-desc">Description <span class="muted">(facultatif)</span></label>
        <textarea class="textarea" id="course-desc" maxlength="1000" rows="3" placeholder="Ce que le couple va découvrir dans ce cours"></textarea>
      </div>
      <div class="field">
        <label for="course-file" id="course-file-label">Fichier du cours (MP3 ou MP4, 50 Mo au plus)</label>
        <input class="input" type="file" id="course-file" accept=".mp3,.mp4,audio/mpeg,video/mp4">
        <p class="small muted mb-0" id="course-file-info" style="margin-top:6px"></p>
      </div>
      <div class="field">
        <label for="course-minutes">Durée en minutes</label>
        <input class="input" type="number" id="course-minutes" min="0" max="600" step="1" inputmode="numeric" style="max-width:160px">
        <p class="small muted mb-0" style="margin-top:6px">Remplie automatiquement d'après le fichier ; vous pouvez la corriger.</p>
      </div>
      <div class="course-upload" id="course-upload" hidden>
        <div class="progress" role="progressbar" aria-label="Envoi du fichier" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress__bar" id="course-upload-bar" style="width:0%"></div></div>
        <p class="small muted mb-0" id="course-upload-text">Envoi du fichier…</p>
      </div>
      <p class="small mb-0" id="course-error" role="alert" hidden style="color:var(--color-danger)"></p>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Annuler</button>
        <button class="btn btn--primary" id="course-save">Enregistrer le cours</button>
      </div>
    </form>
  </div>
</div>

<!-- Modale : écouter ou regarder un cours -->
<div class="modal" id="modal-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title">
  <div class="modal__box modal__box--wide">
    <div class="modal__head">
      <h2 id="preview-title" style="font-size:1.5rem"></h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <div id="preview-body"></div>
  </div>
</div>

<!-- Modale : supprimer un cours -->
<div class="modal" id="modal-course-remove" role="dialog" aria-modal="true" aria-labelledby="course-remove-title">
  <div class="modal__box">
    <div class="modal__head">
      <h2 id="course-remove-title" style="font-size:1.5rem">Supprimer ce cours ?</h2>
      <button class="modal__close" data-close aria-label="Fermer"><i data-icon="x" data-size="18"></i></button>
    </div>
    <p class="muted" id="course-remove-text"></p>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-close>Annuler</button>
      <button type="button" class="btn btn--danger" id="course-remove-confirm">Supprimer</button>
    </div>
  </div>
</div>`,

  init() {
    const $ = id => document.getElementById(id);
    let editing = null;      // cours modifié (null : ajout)
    let removing = null;
    let busy = false;
    let minutesTouched = false;

    const all = () => CH_DATA.modules.flatMap(m => CH.courseLessons(m.id).map(c => ({ ...c, moduleId: m.id })));
    /* Clé « module:id » (en démo, l'identifiant d'un cours est son rang dans le module) */
    const find = key => { const [m, id] = String(key).split(":"); return all().find(c => String(c.moduleId) === m && String(c.id) === id); };
    const mediaSrc = url => /^https:\/\/[^\s"'<>]+$/.test(String(url || "")) ? url : "";
    const typeOf = file => (file.type === "audio/mpeg" || /\.mp3$/i.test(file.name)) ? "audio"
      : (file.type === "video/mp4" || /\.mp4$/i.test(file.name)) ? "video" : null;
    const size = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

    /* ---------- Liste des cours, module par module ---------- */
    function render() {
      $("course-modules").innerHTML = CH_DATA.modules.map(m => {
        const list = CH.courseLessons(m.id);
        const minutes = list.reduce((n, c) => n + (c.minutes || 0), 0);
        return `
        <section class="card course-admin" aria-labelledby="mod-${m.id}">
          <div class="course-admin__head">
            <div>
              <p class="kicker mb-0">Module ${m.id}</p>
              <h2 id="mod-${m.id}" class="course-admin__title">${m.title}</h2>
              <span class="small muted">${list.length ? `${list.length} cours · ${minutes} min` : "Aucun cours pour l'instant"}</span>
            </div>
            <button class="btn btn--ghost btn--sm" type="button" data-add="${m.id}">${icon("plus", 16)} Ajouter</button>
          </div>
          ${list.length ? `<ol class="course-admin__list">${list.map((c, i) => `
            <li class="course-row">
              <span class="course-row__type" title="${c.type === "video" ? "Vidéo" : "Audio"}">${icon(c.type, 16)}</span>
              <span class="course-row__body">
                <strong>${CH.escape(c.title)}</strong>
                <span class="small muted">${c.type === "video" ? "Vidéo" : "Audio"} · ${c.minutes} min${c.speaker ? ` · ${CH.escape(c.speaker)}` : ""}</span>
              </span>
              <span class="row-actions course-row__actions">
                <button class="btn btn--ghost btn--sm" type="button" data-preview="${m.id}:${c.id}" ${mediaSrc(c.url) ? "" : "disabled"} aria-label="${c.type === "video" ? "Voir" : "Écouter"} « ${CH.escape(c.title)} »">${icon("play", 14)}<span class="course-row__label">${c.type === "video" ? "Voir" : "Écouter"}</span></button>
                <button class="btn btn--ghost btn--icon btn--sm" type="button" data-move="up" data-id="${c.id}" ${i === 0 ? "disabled" : ""} aria-label="Monter « ${CH.escape(c.title)} »">${icon("up", 16)}</button>
                <button class="btn btn--ghost btn--icon btn--sm" type="button" data-move="down" data-id="${c.id}" ${i === list.length - 1 ? "disabled" : ""} aria-label="Descendre « ${CH.escape(c.title)} »">${icon("down", 16)}</button>
                <button class="btn btn--ghost btn--icon btn--sm" type="button" data-edit="${m.id}:${c.id}" aria-label="Modifier « ${CH.escape(c.title)} »">${icon("pen", 16)}</button>
                <button class="btn btn--ghost btn--icon btn--sm" type="button" data-remove="${m.id}:${c.id}" aria-label="Supprimer « ${CH.escape(c.title)} »">${icon("trash", 16)}</button>
              </span>
            </li>`).join("")}</ol>` : ""}
        </section>`;
      }).join("");
    }

    /* ---------- Formulaire ---------- */
    function openForm(course, moduleId) {
      editing = course || null;
      minutesTouched = Boolean(course);
      $("course-form").reset();
      $("course-title").textContent = course ? "Modifier le cours" : "Ajouter un cours";
      $("course-module").value = String(course ? course.moduleId : moduleId || 1);
      $("course-name").value = course?.title || "";
      $("course-speaker").value = course?.speaker || "";
      $("course-desc").value = course?.description || "";
      $("course-minutes").value = course ? String(course.minutes) : "";
      $("course-file-label").textContent = course
        ? "Remplacer le fichier (facultatif, MP3 ou MP4, 50 Mo au plus)"
        : "Fichier du cours (MP3 ou MP4, 50 Mo au plus)";
      $("course-file-info").textContent = course ? `Fichier actuel : ${course.type === "video" ? "vidéo" : "audio"}. Laissez vide pour le garder.` : "";
      $("course-error").hidden = true;
      $("course-upload").hidden = true;
      openModal("modal-course");
    }

    function showError(msg) {
      $("course-error").textContent = msg;
      $("course-error").hidden = false;
    }

    /* Durée lue dans le fichier lui-même, avant l'envoi */
    function readMinutes(file, type) {
      return new Promise(resolve => {
        const el = document.createElement(type === "video" ? "video" : "audio");
        const url = URL.createObjectURL(file);
        const done = v => { URL.revokeObjectURL(url); resolve(v); };
        el.preload = "metadata";
        el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? Math.max(1, Math.round(el.duration / 60)) : null);
        el.onerror = () => done(null);
        el.src = url;
      });
    }

    $("course-minutes").addEventListener("input", () => { minutesTouched = true; });
    $("course-file").addEventListener("change", async () => {
      const file = $("course-file").files[0];
      $("course-error").hidden = true;
      if (!file) { $("course-file-info").textContent = ""; return; }
      const type = typeOf(file);
      if (!type) { $("course-file-info").textContent = ""; return showError("Ce fichier n'est ni un MP3 ni un MP4."); }
      if (file.size > COURSE_MAX_BYTES) showError(`Ce fichier pèse ${size(file.size)} : la limite est de 50 Mo. Compressez-le avant de l'envoyer.`);
      $("course-file-info").textContent = `${type === "video" ? "Vidéo" : "Audio"} · ${size(file.size)}`;
      const minutes = await readMinutes(file, type);
      if (minutes && !minutesTouched) $("course-minutes").value = String(minutes);
    });

    $("course-form").addEventListener("submit", async e => {
      e.preventDefault();
      if (busy) return;
      const file = $("course-file").files[0] || null;
      const payload = {
        moduleId: Number($("course-module").value),
        title: CH.clean($("course-name").value, 160),
        speaker: CH.clean($("course-speaker").value, 120),
        description: $("course-desc").value.trim().slice(0, 1000),
        minutes: Math.max(0, Math.min(600, Math.round(Number($("course-minutes").value) || 0)))
      };
      if (!payload.title) { $("course-name").focus(); return showError("Merci d'indiquer le titre du cours."); }
      if (!editing && !file) return showError("Merci de choisir le fichier du cours (MP3 ou MP4).");
      if (file && !typeOf(file)) return showError("Ce fichier n'est ni un MP3 ni un MP4.");
      if (file && file.size > COURSE_MAX_BYTES) return showError(`Ce fichier pèse ${size(file.size)} : la limite est de 50 Mo. Compressez-le avant de l'envoyer.`);
      if (!Remote.on) return showError("Mode démo : l'enregistrement des cours nécessite la connexion à Supabase.");

      busy = true;
      $("course-save").disabled = true;
      $("course-error").hidden = true;
      let path = null;
      try {
        if (file) {
          payload.type = typeOf(file);
          $("course-upload").hidden = false;
          const bar = $("course-upload-bar");
          path = await Api.admin.uploadCourseFile(payload.moduleId, payload.type, file, p => {
            const pct = Math.round(p * 100);
            bar.style.width = pct + "%";
            bar.parentElement.setAttribute("aria-valuenow", String(pct));
            $("course-upload-text").textContent = `Envoi du fichier… ${pct} %`;
          });
          payload.path = path;
          $("course-upload-text").textContent = "Fichier reçu. Enregistrement du cours…";
        }
        if (editing) await Api.admin.updateCourse(editing.id, payload);
        else await Api.admin.addCourse(payload);
        path = null;   // le fichier appartient désormais au cours
        await Remote.refresh();
        closeModal("modal-course");
        toast(editing ? "Le cours a été mis à jour." : "Le cours a été ajouté. Les couples le verront dans l'École du mariage.");
        render();
      } catch (err) {
        showError(err.message || "Une erreur est survenue. Merci de réessayer.");
        if (path) Api.admin.discardCourseFile(path).catch(() => {});
      } finally {
        busy = false;
        $("course-save").disabled = false;
      }
    });

    /* ---------- Actions sur la liste ---------- */
    $("btn-add").addEventListener("click", () => openForm(null, 1));
    $("course-modules").addEventListener("click", async e => {
      const add = e.target.closest("[data-add]");
      if (add) return openForm(null, Number(add.dataset.add));
      const edit = e.target.closest("[data-edit]");
      if (edit) return openForm(find(edit.dataset.edit));
      const prev = e.target.closest("[data-preview]");
      if (prev) {
        const c = find(prev.dataset.preview);
        const src = mediaSrc(c?.url);
        if (!src) return;
        $("preview-title").textContent = c.title;
        $("preview-body").innerHTML = c.type === "video"
          ? `<video class="player__video" controls autoplay playsinline src="${CH.escape(src)}"></video>`
          : `<audio class="player__audio-el" controls autoplay src="${CH.escape(src)}"></audio>`;
        return openModal("modal-preview");
      }
      const move = e.target.closest("[data-move]");
      if (move && !move.disabled) {
        if (!Remote.on) return toast("Mode démo : l'ordre des cours se modifie une fois le site relié à Supabase.");
        move.disabled = true;
        try { await Api.admin.moveCourse(move.dataset.id, move.dataset.move); await Remote.refresh(); render(); }
        catch (err) { toast(err.message); move.disabled = false; }
        return;
      }
      const del = e.target.closest("[data-remove]");
      if (del) {
        removing = find(del.dataset.remove);
        $("course-remove-text").textContent = `« ${removing.title} » sera retiré de l'École du mariage, avec son fichier. La progression des couples sur ce cours est effacée.`;
        openModal("modal-course-remove");
      }
    });

    $("course-remove-confirm").addEventListener("click", async () => {
      if (!removing) return;
      if (!Remote.on) { closeModal("modal-course-remove"); return toast("Mode démo : la suppression des cours nécessite la connexion à Supabase."); }
      const btn = $("course-remove-confirm");
      btn.disabled = true;
      try {
        await Api.admin.removeCourse(removing.id);
        await Remote.refresh();
        closeModal("modal-course-remove");
        toast("Le cours a été supprimé.");
        render();
      } catch (err) { toast(err.message); }
      finally { btn.disabled = false; removing = null; }
    });

    /* La lecture s'arrête quand on ferme l'aperçu */
    const stopPreview = () => setTimeout(() => {
      if (!$("modal-preview")?.classList.contains("is-open")) { const b = $("preview-body"); if (b) b.innerHTML = ""; }
    });
    App.onDocument("click", stopPreview);
    App.onDocument("keydown", e => { if (e.key === "Escape") stopPreview(); });

    /* Cours ajoutés depuis un autre poste : la liste suit l'état rechargé */
    let shown = JSON.stringify(CH_DATA.courses);
    App.onDocument("cheminant:remote", () => {
      const now = JSON.stringify(CH_DATA.courses);
      if (now !== shown) { shown = now; render(); }
    });

    render();
  }
});
