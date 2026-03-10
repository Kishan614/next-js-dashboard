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

    var banner = document.createElement("div");
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "polite");
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;" +
      "gap:16px;padding:12px 20px;min-height:48px;box-sizing:border-box;" +
      "background:#fef2f2;border:1px solid #fecaca;border-top:none;border-radius:0 0 8px 8px;" +
      "box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);font-family:system-ui,-apple-system,sans-serif;";

    var textWrap = document.createElement("div");
    textWrap.setAttribute("data-popup-bridge-body", "true");
    textWrap.style.cssText =
      "flex:1;color:#1f2937;font-size:0.9375rem;line-height:1.5;white-space:pre-wrap;";
    textWrap.textContent = displayText;

    banner.appendChild(textWrap);
    container = banner;
    document.body.appendChild(banner);

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
