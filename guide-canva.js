// ===== GUIDE CANVA — Script (vanilla) =====
(function(){
  // Remplace par l'URL ?embed de ton design si besoin
  const CANVA_URL = "https://www.canva.com/design/DAGx7TmWtA8/7NZvvs6qKpHvqM_jeXgz4g/view?embed";

  // Marges bord écran
  const MARGIN = 12;

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

  // Taille selon mode
  const sizeForMode = (mode) => {
    if (mode === "small")   return [320, 180];                                            // ~16:9
    if (mode === "quarter") return [Math.round(innerWidth*0.6), Math.round(innerHeight*0.6)]; // lisible
    if (mode === "full")    return [innerWidth, innerHeight];
    return [320, 180];
  };

  // Clamp overlay dans viewport (avec marge)
  const clampToViewport = (overlay) => {
    const rect = overlay.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    let left = rect.left;
    let top  = rect.top;

    const maxLeft = Math.max(MARGIN, innerWidth  - w - MARGIN);
    const maxTop  = Math.max(MARGIN, innerHeight - h - MARGIN);

    left = Math.min(Math.max(MARGIN, left), maxLeft);
    top  = Math.min(Math.max(MARGIN, top),  maxTop);

    overlay.style.left = left + "px";
    overlay.style.top  = top  + "px";
    overlay.style.right = "auto";
    overlay.style.bottom = "auto";
  };

  // Redimensionne en conservant le centre, puis clamp
  const resizeKeepCenter = (overlay, newW, newH) => {
    const rect = overlay.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    let left = Math.round(cx - newW / 2);
    let top  = Math.round(cy - newH / 2);

    const maxLeft = Math.max(MARGIN, innerWidth  - newW - MARGIN);
    const maxTop  = Math.max(MARGIN, innerHeight - newH - MARGIN);

    left = Math.min(Math.max(MARGIN, left), maxLeft);
    top  = Math.min(Math.max(MARGIN, top),  maxTop);

    overlay.style.width  = newW + "px";
    overlay.style.height = newH + "px";
    overlay.style.left   = left + "px";
    overlay.style.top    = top  + "px";
    overlay.style.right  = "auto";
    overlay.style.bottom = "auto";
  };

  // Positionne bottom-right (en left/top) pour stabilité
  const snapBottomRight = (overlay, w, h) => {
    const left = Math.max(MARGIN, innerWidth  - MARGIN - w);
    const top  = Math.max(MARGIN, innerHeight - MARGIN - h);
    overlay.style.width  = w + "px";
    overlay.style.height = h + "px";
    overlay.style.left   = left + "px";
    overlay.style.top    = top  + "px";
    overlay.style.right  = "auto";
    overlay.style.bottom = "auto";
  };

  function mountUI(){
    // Toolbar (icône “?”)
    const toolbar = el("div", { id: "gc-toolbar", role: "toolbar", "aria-label": "Contrôle Guide Canva" }, [
      el("button", { id: "gc-open", className: "gc-iconbtn", "aria-label": "Ouvrir le guide Canva", title: "Ouvrir le guide Canva", textContent: "?" })
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
      el("button", { id: "gc-small",  className: "gc-btn", title: "Vue réduite",        textContent: "RÉDUIRE" }),
      el("button", { id: "gc-quarter", className: "gc-btn", title: "1/4 de l'écran",     textContent: "1/4 ÉCRAN" }),
      el("button", { id: "gc-full",    className: "gc-btn", title: "Plein écran",        textContent: "PLEIN ÉCRAN" }),
      el("button", { id: "gc-reset",   className: "gc-btn", title: "Revenir à l'état initial", textContent: "Revenir" }),
    ]);

    overlay.append(iframe, handle, controls);
    document.body.append(toolbar, overlay);

    // Références
    const openBtn = toolbar.querySelector("#gc-open");
    const bSmall  = controls.querySelector("#gc-small");
    const bQuart  = controls.querySelector("#gc-quarter");
    const bFull   = controls.querySelector("#gc-full");
    const bReset  = controls.querySelector("#gc-reset");

    // Ouverture en bas-droite (small)
    const openAtSmall = () => {
      overlay.style.display = "block";
      const [w, h] = sizeForMode("small");
      overlay.style.borderRadius = "14px";
      snapBottomRight(overlay, w, h);
      overlay.dataset.mode = "small";
    };

    // Changement de mode
    const setMode = (mode) => {
      overlay.dataset.mode = mode;

      if (mode === "full") {
        // plein viewport ; toolbar toujours visible
        overlay.style.left = "0px";
        overlay.style.top  = "0px";
        overlay.style.width  = innerWidth + "px";
        overlay.style.height = innerHeight + "px";
        overlay.style.borderRadius = "0";
        overlay.style.right = "auto";
        overlay.style.bottom = "auto";
        return;
      }

      if (mode === "small") {
        // -> doit retourner en bas-droite
        const [w, h] = sizeForMode("small");
        overlay.style.borderRadius = "14px";
        snapBottomRight(overlay, w, h);
        return;
      }

      // quarter : conserver le centre, puis clamp
      const [w, h] = sizeForMode("quarter");
      overlay.style.borderRadius = "14px";
      resizeKeepCenter(overlay, w, h);
    };

    // Actions
    openBtn.addEventListener("click", openAtSmall);
    bSmall.addEventListener("click",  () => setMode("small"));
    bQuart.addEventListener("click",  () => setMode("quarter"));
    bFull .addEventListener("click",  () => setMode("full"));
    bReset.addEventListener("click",  () => { overlay.style.display = "none"; });

    // Échap ferme seulement l'overlay
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.style.display = "none"; });

    // ===== Drag & Drop (borné au viewport) =====
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, w = 0, h = 0;

    const startDrag = (e) => {
      if (overlay.dataset.mode === "full") return; // pas de drag en plein écran
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;

      // Normalise en left/top
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

      let left = ox + dx;
      let top  = oy + dy;

      // Clamp
      const maxLeft = Math.max(MARGIN, innerWidth  - w - MARGIN);
      const maxTop  = Math.max(MARGIN, innerHeight - h - MARGIN);

      left = Math.min(Math.max(MARGIN, left), maxLeft);
      top  = Math.min(Math.max(MARGIN, top),  maxTop);

      overlay.style.left = left + "px";
      overlay.style.top  = top  + "px";
    };

    const endDrag = () => { dragging = false; };

    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", onDrag);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    // Re-clamp si la fenêtre est redimensionnée
    window.addEventListener("resize", () => {
      if (overlay.style.display !== "none" && overlay.dataset.mode !== "full") {
        clampToViewport(overlay);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUI);
  } else {
    mountUI();
  }
})();
