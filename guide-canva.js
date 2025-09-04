// ===== GUIDE CANVA — Script (vanilla) =====
(function(){
  // Remplace par l'URL ?embed de ton design si besoin
  const CANVA_URL = "https://www.canva.com/design/DAGx7TmWtA8/7NZvvs6qKpHvqM_jeXgz4g/view?embed";

  // Helpers
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k in n) n[k] = v;
      else n.setAttribute(k, v);
    });
    children.forEach(c => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };

  function mountUI(){
    // Toolbar globale (bouton d'ouverture)
    const toolbar = el("div", { id: "gc-toolbar", role: "toolbar", "aria-label": "Contrôle Guide Canva" }, [
      el("button", { id: "gc-open", className: "gc-btn", title: "Afficher le guide Canva", textContent: "GUIDE CANVA" })
    ]);

    // Overlay + handle + iframe + commandes bas
    const overlay = el("div", { id: "gc-overlay", "data-mode": "small", "aria-label": "Guide Canva flottant" });
    const handle  = el("div", { id: "gc-handle", textContent: "Guide Canva — glisser pour déplacer" });
    const iframe  = el("iframe", {
      id: "gc-iframe",
      src: CANVA_URL,
      /* pas de fullscreen natif pour garder la toolbar visible */
      allow: "autoplay; encrypted-media",
      loading: "lazy",
      referrerPolicy: "strict-origin-when-cross-origin"
    });
    const controls = el("div", { id: "gc-controls", role: "toolbar", "aria-label": "Commandes d'affichage" }, [
      el("button", { id: "gc-small",  className: "gc-btn", title: "Vue réduite",        textContent: "RÉDUIRE" }), // renommé
      el("button", { id: "gc-quarter", className: "gc-btn", title: "1/4 de l'écran",     textContent: "1/4 ÉCRAN" }),
      el("button", { id: "gc-full",    className: "gc-btn", title: "Plein écran",        textContent: "PLEIN ÉCRAN" }),
      el("button", { id: "gc-reset",   className: "gc-btn", title: "Revenir à l'état initial", textContent: "Revenir" }),
    ]);

    overlay.append(iframe, handle, controls);
    document.body.append(toolbar, overlay);

    // Références contrôles
    const openBtn = toolbar.querySelector("#gc-open");
    const bSmall  = controls.querySelector("#gc-small");
    const bQuart  = controls.querySelector("#gc-quarter");
    const bFull   = controls.querySelector("#gc-full");
    const bReset  = controls.querySelector("#gc-reset");

    // => Clamp util pour garder l'overlay dans l'écran
    const clampToViewport = () => {
      // calcule la position actuelle et recolle si nécessaire
      const rect = overlay.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // si on est encore en bottom/right (auto), on bascule en left/top absolus
      let left = rect.left;
      let top  = rect.top;

      const maxLeft = Math.max(0, window.innerWidth  - w);
      const maxTop  = Math.max(0, window.innerHeight - h);

      left = Math.min(Math.max(0, left), maxLeft);
      top  = Math.min(Math.max(0, top),  maxTop);

      overlay.style.left = left + "px";
      overlay.style.top  = top  + "px";
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
    };

    // Modes d'affichage
    const setMode = (mode) => {
      overlay.dataset.mode = mode;

      // Dimensions et position par défaut (coin bas-droite)
      overlay.style.top = "auto";
      overlay.style.left = "auto";
      overlay.style.bottom = "20px";
      overlay.style.right = "20px";
      overlay.style.borderRadius = "14px";

      if (mode === "small"){
        overlay.style.width  = "320px";
        overlay.style.height = "180px"; // ~16:9
      } else if (mode === "quarter"){
        overlay.style.width  = "60vw";
        overlay.style.height = "60vh";
      } else if (mode === "full"){
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.bottom = "auto";
        overlay.style.right = "auto";
        overlay.style.width  = "100vw";
        overlay.style.height = "100vh";
        overlay.style.borderRadius = "0";
      }

      // Puis on normalise en left/top + clamp, pour éviter toute sortie d'écran
      if (mode !== "full") clampToViewport();
    };

    // Ouvrir / changer de mode / revenir
    openBtn.addEventListener("click", () => {
      overlay.style.display = "block";
      setMode("small");
    });
    bSmall.addEventListener("click",  () => setMode("small"));
    bQuart.addEventListener("click",  () => setMode("quarter"));
    bFull .addEventListener("click",  () => setMode("full"));
    bReset.addEventListener("click",  () => {
      overlay.style.display = "none";
    });

    // Échap ferme seulement l'overlay
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.style.display = "none";
    });

    // ===== Drag & Drop de l'overlay via le handle (borné au viewport) =====
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, w = 0, h = 0;

    const startDrag = (e) => {
      if (overlay.dataset.mode === "full") return; // pas de drag en plein écran
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;

      // Normalise en coordonnées left/top (au cas où)
      const rect = overlay.getBoundingClientRect();
      overlay.style.left = rect.left + "px";
      overlay.style.top  = rect.top + "px";
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";

      ox = rect.left; oy = rect.top;
      w = rect.width; h = rect.height;
    };

    const onDrag = (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;

      // Position souhaitée
      let left = ox + dx;
      let top  = oy + dy;

      // Clamp dans l'écran
      const maxLeft = Math.max(0, window.innerWidth  - w);
      const maxTop  = Math.max(0, window.innerHeight - h);

      if (left < 0) left = 0;
      if (top  < 0) top  = 0;
      if (left > maxLeft) left = maxLeft;
      if (top  > maxTop)  top  = maxTop;

      overlay.style.left = left + "px";
      overlay.style.top  = top  + "px";
    };

    const endDrag = () => { dragging = false; };

    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", onDrag);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    // Re-clamp si la fenêtre est redimensionnée (ou si orientation change)
    window.addEventListener("resize", () => {
      if (overlay.style.display !== "none" && overlay.dataset.mode !== "full") {
        clampToViewport();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUI);
  } else {
    mountUI();
  }
})();
