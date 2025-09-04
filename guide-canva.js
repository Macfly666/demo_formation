// ===== GUIDE CANVA — Script (vanilla) =====
(function(){
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
    // Toolbar
    const toolbar = el("div", { id: "gc-toolbar", role: "toolbar", "aria-label": "Contrôles Guide Canva" }, [
      el("button", { id: "gc-open", className: "gc-btn", title: "Afficher le guide Canva", textContent: "GUIDE CANVA" }),
      el("div", { id: "gc-controls", className: "gc-hidden", style: { display: "flex", gap: "8px" } }, [
        el("button", { id: "gc-small",  className: "gc-btn", title: "Vue réduite",        textContent: "RÉDUITE" }),
        el("button", { id: "gc-quarter", className: "gc-btn", title: "1/4 de l'écran",     textContent: "1/4 ÉCRAN" }),
        el("button", { id: "gc-full",    className: "gc-btn", title: "Plein écran",        textContent: "PLEIN ÉCRAN" }),
        el("button", { id: "gc-reset",   className: "gc-btn", title: "Revenir à l'état initial", textContent: "Revenir" }),
      ]),
    ]);

    // Overlay + handle + iframe
    const overlay = el("div", { id: "gc-overlay", "data-mode": "small", "aria-label": "Guide Canva flottant" });
    const handle  = el("div", { id: "gc-handle", textContent: "Guide Canva — glisser pour déplacer" });
    const iframe  = el("iframe", {
      id: "gc-iframe",
      src: CANVA_URL,
      // on ne donne PAS 'fullscreen' pour garder la toolbar visible
      allow: "autoplay; encrypted-media",
      loading: "lazy",
      referrerPolicy: "strict-origin-when-cross-origin"
    });
    overlay.appendChild(iframe);
    overlay.appendChild(handle);

    document.body.appendChild(toolbar);
    document.body.appendChild(overlay);

    // Logic
    const openBtn = toolbar.querySelector("#gc-open");
    const ctrls   = toolbar.querySelector("#gc-controls");
    const bSmall  = toolbar.querySelector("#gc-small");
    const bQuart  = toolbar.querySelector("#gc-quarter");
    const bFull   = toolbar.querySelector("#gc-full");
    const bReset  = toolbar.querySelector("#gc-reset");

    const showControls = (show) => {
      openBtn.classList.toggle("gc-hidden", show);
      ctrls.classList.toggle("gc-hidden", !show);
    };

    const setMode = (mode) => {
      overlay.dataset.mode = mode;
      // Defaults (floating bottom-right)
      overlay.style.top = "auto";
      overlay.style.left = "auto";
      overlay.style.bottom = "20px";
      overlay.style.right = "20px";
      overlay.style.borderRadius = "14px";

      if (mode === "small"){
        overlay.style.width  = "320px";
        overlay.style.height = "180px"; // ~16:9
      } else if (mode === "quarter"){
        // plus grand pour plus de lisibilité
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
    };

    openBtn.addEventListener("click", () => {
      overlay.style.display = "block";
      setMode("small");
      showControls(true);
    });
    bSmall.addEventListener("click",  () => setMode("small"));
    bQuart.addEventListener("click",  () => setMode("quarter"));
    bFull .addEventListener("click",  () => setMode("full"));
    bReset.addEventListener("click",  () => {
      overlay.style.display = "none";
      showControls(false);
    });

    // Échap ferme seulement l'overlay
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.style.display = "none";
    });

    // ===== Drag & Drop de l'overlay via le handle =====
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    const startDrag = (e) => {
      if (overlay.dataset.mode === "full") return; // pas de drag en plein écran
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      // bascule en coordonnées gauche/haut si nécessaire
      const rect = overlay.getBoundingClientRect();
      overlay.style.left = rect.left + "px";
      overlay.style.top  = rect.top + "px";
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
      ox = rect.left; oy = rect.top;
    };
    const onDrag = (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      overlay.style.left = (ox + dx) + "px";
      overlay.style.top  = (oy + dy) + "px";
    };
    const endDrag = () => { dragging = false; };

    handle.addEventListener("pointerdown", startDrag);
    handle.addEventListener("pointermove", onDrag);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUI);
  } else {
    mountUI();
  }
})();
