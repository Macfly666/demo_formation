// ===== GUIDE CANVA — Script (vanilla) =====
(function(){
  // URL ?embed de ton design Canva
  const CANVA_URL = "https://www.canva.com/design/DAGx7TmWtA8/7NZvvs6qKpHvqM_jeXgz4g/view?embed";

  // Paramètres
  const MARGIN = 12;               // marge intérieure du viewport
  const CONTROLS_LINGER_MS = 3000; // durée d’affichage des commandes après survol

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

  const sizeForMode = (mode) => {
    if (mode === "small")   return [320, 180];                                              // ~16:9
    if (mode === "quarter") return [Math.round(innerWidth*0.6), Math.round(innerHeight*0.6)]; // lisible
    if (mode === "full")    return [innerWidth, innerHeight];
    return [320, 180];
  };

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
    // Toolbar (icône “?” en bas-droite)
    const toolbar = el("div", { id: "gc-toolbar", role: "toolbar", "aria-label": "Contrôle Guide Canva" }, [
      el("button", { id: "gc-open", className: "gc-iconbtn", "aria-label": "Ouvrir le guide Canva", title: "Ouvrir le guide Canva", textContent: "?" })
    ]);

    // Overlay + handle + iframe + commandes bas
    const overlay = el("div", { id: "gc-overlay", "data-mode": "small", "aria-label": "Guide Canva flottant" });
    const handle  = el("div", { id: "gc-handle", textContent: "Guide Canva — glisser pour déplacer" });
    const iframe  = el("iframe", {
      id: "gc-iframe",
      src: CANVA_URL,
      allow: "autoplay; encrypted-media", // pas de fullscreen natif
      loading: "lazy",
      referrerPolicy: "strict-origin-when-cross-origin"
    });
    const controls = el("div", { id: "gc-controls", role: "toolbar", "aria-label": "Commandes d'affichage" }, [
      el("button", { id: "gc-small",  className: "gc-btn", title: "Vue réduite",        textContent: "RÉDUIRE" }),
      el("button", { id: "gc-quarter", className: "gc-btn", title: "1/4 de l'écran",     textContent: "1/4 ÉCRAN" }),
      el("button", { id: "gc-full",    className: "gc-btn", title: "Plein écran",        textContent: "PLEIN ÉCRAN" }),
      el("button", { id: "gc-reset",   className: "gc-btn", title: "Fermer l'affichage", textContent: "QUITTER" }),
    ]);

    overlay.append(iframe, handle, controls);
    document.body.append(toolbar, overlay);

    // Références
    const openBtn = toolbar.querySelector("#gc-open");
    const bSmall  = controls.querySelector("#gc-small");
    const bQuart  = controls.querySelector("#gc-quarter");
    const bFull   = controls.querySelector("#gc-full");
    const bReset  = controls.querySelector("#gc-reset");

    // ----- commandes visibles au survol (avec linger)
    let hideT = null;
    const showControlsTemp = () => {
      overlay.classList.add("controls-visible");
      if (hideT) clearTimeout(hideT);
      hideT = setTimeout(() => {
        overlay.classList.remove("controls-visible");
      }, CONTROLS_LINGER_MS);
    };
    overlay.addEventListener("pointerenter", showControlsTemp);
    overlay.addEventListener("pointermove",  showControlsTemp);
    controls.addEventListener("pointerenter", showControlsTemp);
    handle  .addEventListener("pointerenter", showControlsTemp);

    // ----- OUVRIR (small, bas-droite) + micro-anim
    const openAtSmall = () => {
      toolbar.style.display = "none";      // cache l’icône ?
      const [w, h] = sizeForMode("small");
      overlay.style.borderRadius = "14px";
      snapBottomRight(overlay, w, h);
      overlay.dataset.mode = "small";

      // micro-anim (CSS) : on passe en état ouvert
      overlay.classList.add("is-open");
      overlay.classList.add("controls-visible"); // visibles au départ
    };

    // ----- FERMER + anim out : retire la classe .is-open
    const closeOverlay = () => {
      overlay.classList.remove("controls-visible");
      overlay.classList.remove("is-open");
      toolbar.style.display = "";          // ré-affiche l’icône ?
    };

    // ----- Changement de mode
    const setMode = (mode) => {
      overlay.dataset.mode = mode;

      if (mode === "full") {
        overlay.style.left = "0px";
        overlay.style.top  = "0px";
        overlay.style.width  = innerWidth + "px";
        overlay.style.height = innerHeight + "px";
        overlay.style.borderRadius = "0";
        overlay.style.right = "auto";
        overlay.style.bottom = "auto";
        showControlsTemp();
        return;
      }

      if (mode === "small") {
        const [w, h] = sizeForMode("small");
        overlay.style.borderRadius = "14px";
        snapBottomRight(overlay, w, h); // revient en bas-droite
        showControlsTemp();
        return;
      }

      // quarter : conserve le centre, puis clamp
      const [w, h] = sizeForMode("quarter");
      overlay.style.borderRadius = "14px";
      resizeKeepCenter(overlay, w, h);
      showControlsTemp();
    };

    // Actions
    openBtn.addEventListener("click", openAtSmall);
    bSmall.addEventListener("click",  () => setMode("small"));
    bQuart.addEventListener("click",  () => setMode("quarter"));
    bFull .addEventListener("click",  () => setMode("full"));
    bReset.addEventListener("click",  closeOverlay);

    // Échap ferme
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlay(); });

    // ===== Drag & Drop (borné au viewport) =====
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, w = 0, h = 0;

    const startDrag = (e) => {
      if (overlay.dataset.mode === "full") return; // pas de drag en plein écran
      dragging = true;
      overlay.classList.add("no-trans");  // coupe transitions pendant le drag
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

      showControlsTemp();
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

    const endDrag = () => {
      dragging = false;
      overlay.classList.remove("no-trans"); // réactive transitions
      showControlsTemp();
    };

    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", onDrag);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    // Re-clamp si la fenêtre est redimensionnée
    window.addEventListener("resize", () => {
      if (overlay.classList.contains("is-open") && overlay.dataset.mode !== "full") {
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
