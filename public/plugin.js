/**
 * Popup bridge script: polls the dashboard API and shows an error-style banner
 * when the dashboard toggle is on. Set window.DASHBOARD_POPUP_API_URL before
 * loading this script. Blocks common DevTools shortcuts (deterrent only).
 */
(function () {
  "use strict";

  var BASE = typeof window.DASHBOARD_POPUP_API_URL === "string"
    ? window.DASHBOARD_POPUP_API_URL.replace(/\/$/, "")
    : "";
  var POLL_MS = 2000;
  var container = null;

  function apiUrl(path) {
    return BASE + path;
  }

  function fetchState() {
    if (!BASE) return Promise.resolve({ show: false });
    return fetch(apiUrl("/api/popup-state"))
      .then(function (r) { return r.json(); })
      .catch(function () { return { show: false, content: "" }; });
  }

  function hidePopup() {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  }

  function getBodyEl() {
    return container && container.querySelector("[data-popup-bridge-body]");
  }

  function blockDevToolsShortcuts(e) {
    var key = e.key || e.keyCode;
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    if (key === "F12" || key === 123) {
      e.preventDefault();
      return false;
    }
    if (ctrl && shift && (key === "I" || key === "J" || key === "C" || key === 73 || key === 74 || key === 67)) {
      e.preventDefault();
      return false;
    }
    if (ctrl && (key === "U" || key === 85)) {
      e.preventDefault();
      return false;
    }
  }

  function blockContextMenu(e) {
    e.preventDefault();
    return false;
  }

  function setupDevToolsDeterrent() {
    document.addEventListener("keydown", blockDevToolsShortcuts, true);
    document.addEventListener("keyup", blockDevToolsShortcuts, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
  }

  function showPopup(data) {
    var content = (data && typeof data.content === "string") ? data.content : "";
    var displayText = content.trim() || "Something went wrong. Please refresh the page or try again later.";

    if (container && container.parentNode) {
      var bodyEl = getBodyEl();
      if (bodyEl) {
        bodyEl.textContent = displayText;
        bodyEl.style.whiteSpace = "pre-wrap";
      }
      return;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    var overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-live", "polite");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding:15vh 0 24px;box-sizing:border-box;" +
      "background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);font-family:system-ui,-apple-system,sans-serif;";

    var modal = document.createElement("div");
    modal.style.cssText =
      "background:#fef2f2;border:1px solid #fecaca;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);" +
      "width:70vw;max-width:70%;padding:28px 32px;box-sizing:border-box;";

    var textWrap = document.createElement("div");
    textWrap.setAttribute("data-popup-bridge-body", "true");
    textWrap.style.cssText =
      "color:#1f2937;font-size:1.0625rem;line-height:1.6;white-space:pre-wrap;";
    textWrap.textContent = displayText;

    modal.appendChild(textWrap);
    overlay.appendChild(modal);
    modal.onclick = function (e) { e.stopPropagation(); };
    container = overlay;
    document.body.appendChild(overlay);

    setupDevToolsDeterrent();
  }

  function poll() {
    fetchState().then(function (data) {
      if (data.show) {
        showPopup(data);
      } else {
        hidePopup();
      }
    });
  }

  if (BASE) {
    poll();
    setInterval(poll, POLL_MS);
  }
})();
