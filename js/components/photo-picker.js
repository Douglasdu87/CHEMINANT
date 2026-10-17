/* Photos de profil : une photo principale (exigée) et 3 photos facultatives.
   Les images sont réduites dans le navigateur (JPEG, 1000 px au plus) avant l'envoi. */

const PHOTO_MAX_EXTRA = 3;
const PHOTO_MAX_SIDE = 1000;

/* Fichier choisi → data URL JPEG réduite */
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error("Merci de choisir une image (JPEG, PNG ou WebP)."));
    if (file.size > 15 * 1024 * 1024) return reject(new Error("Cette image est trop lourde (15 Mo au maximum)."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const g = canvas.getContext("2d");
      g.fillStyle = "#ffffff";   // fond blanc pour les PNG transparents
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Cette image n'a pas pu être lue.")); };
    img.src = url;
  });
}

/* Liens d'image acceptés dans le markup : data URL JPEG (démo, aperçu) ou lien https signé par le serveur */
function safePhotoSrc(src) {
  const s = String(src || "");
  return /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s) ? s : "";
}

/* Galerie d'un profil : photo principale + photos facultatives */
function photoGallery(p) {
  const all = [p.photo, ...(p.photos || [])].map(safePhotoSrc).filter(Boolean);
  if (!all.length) return "";
  return `<div class="photo-gallery photo-gallery--${Math.min(all.length, 4)}">
    ${all.map((src, i) => `<figure class="photo-gallery__item"><img src="${src}" alt="Photo ${i + 1} de ${CH.escape(p.firstName)}" loading="lazy"></figure>`).join("")}
  </div>`;
}

/* Gestion des photos (Mon profil, inscription).
   opts : { photo, photos, onMain(dataUrl), onAdd(dataUrl), onRemove(index) } ; chaque fonction
   renvoie une Promise et met à jour opts.photo / opts.photos, puis la grille est redessinée. */
function mountPhotoManager(box, opts) {
  const slot = (src, label, attrs) => `
    <div class="photo-slot ${src ? "has-photo" : ""}">
      ${src ? `<img src="${src}" alt="${label}">` : `<span class="photo-slot__empty">${icon("camera", 22)}<span>${label}</span></span>`}
      ${attrs}
    </div>`;
  function render() {
    const main = safePhotoSrc(opts.photo);
    const extras = (opts.photos || []).map(safePhotoSrc).filter(Boolean);
    box.innerHTML = `
      <div class="photo-grid">
        <div class="photo-grid__main">
          ${slot(main, "Photo de profil", `<label class="btn btn--${main ? "ghost" : "primary"} btn--sm photo-slot__btn">${main ? "Changer" : "Ajouter"}<input type="file" accept="image/*" class="sr-only" data-photo="main"></label>`)}
          <span class="small"><strong>Photo de profil</strong> <span class="badge ${main ? "badge--sage" : "badge--amber"}">${main ? "Ajoutée" : "Exigée"}</span></span>
        </div>
        <div class="photo-grid__extras">
          ${extras.map((src, i) => slot(src, `Photo ${i + 2}`, `<button type="button" class="photo-slot__remove" data-remove="${i}" aria-label="Retirer la photo ${i + 2}">${icon("x", 16)}</button>`)).join("")}
          ${extras.length < PHOTO_MAX_EXTRA ? `<label class="photo-slot photo-slot--add">
              <span class="photo-slot__empty">${icon("plus", 22)}<span>Ajouter une photo</span></span>
              <input type="file" accept="image/*" class="sr-only" data-photo="extra" aria-label="Ajouter une photo facultative">
            </label>` : ""}
        </div>
      </div>
      <p class="hint" style="margin-top:10px">Une photo de profil où l'on voit bien votre visage est exigée : elle permet de mieux recommander votre profil. Vous pouvez ajouter jusqu'à ${PHOTO_MAX_EXTRA} autres photos, au choix.</p>`;
  }
  box.addEventListener("change", async e => {
    const input = e.target.closest("[data-photo]");
    if (!input || !input.files[0]) return;
    box.classList.add("is-busy");
    try {
      const data = await resizePhoto(input.files[0]);
      await (input.dataset.photo === "main" ? opts.onMain(data) : opts.onAdd(data));
    } catch (err) {
      toast(err.message || "La photo n'a pas pu être ajoutée.");
    }
    box.classList.remove("is-busy");
    render();
  });
  box.addEventListener("click", async e => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    box.classList.add("is-busy");
    try { await opts.onRemove(Number(btn.dataset.remove)); } catch (err) { toast(err.message || "La photo n'a pas pu être retirée."); }
    box.classList.remove("is-busy");
    render();
  });
  render();
  return { render };
}
