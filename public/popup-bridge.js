/**
 * Popup bridge script: polls the dashboard API and shows a popup on this page
 * when the dashboard toggle is on. Set window.DASHBOARD_POPUP_API_URL before
 * loading this script (e.g. https://your-dashboard.vercel.app).
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

  function postState(show) {
    if (!BASE) return Promise.resolve();
    return fetch(apiUrl("/api/popup-state"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show: show }),
    }).catch(function () {});
  }

  function hidePopup() {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  }

  function closePopup() {
    postState(false);
    hidePopup();
  }

  function getBodyEl() {
    return container && container.querySelector("[data-popup-bridge-body]");
  }

  function showPopup(data) {
    var content = (data && typeof data.content === "string") ? data.content : "";
    var displayText = content.trim() || "Turn the switch off on the dashboard or click \u00D7 to close.";

    if (container && container.parentNode) {
      var bodyEl = getBodyEl();
      if (bodyEl) {
        bodyEl.textContent = displayText;
        bodyEl.style.whiteSpace = "pre-wrap";
      }
      return;
    }

    var overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "popup-bridge-title");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;z-index:2147483647;padding:16px;";

    var modal = document.createElement("div");
    modal.style.cssText =
      "background:#1e293b;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);" +
      "max-width:24rem;width:100%;border:1px solid #334155;";

    var header = document.createElement("div");
    header.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #334155;";

    var title = document.createElement("h2");
    title.id = "popup-bridge-title";
    title.textContent = "Popup";
    title.style.cssText = "font-size:1.125rem;font-weight:600;color:#e2e8f0;margin:0;";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "\u00D7";
    closeBtn.style.cssText =
      "width:32px;height:32px;border:none;background:transparent;color:#94a3b8;font-size:1.5rem;line-height:1;" +
      "cursor:pointer;border-radius:6px;display:flex;align-items:center;justify-content:center;";
    closeBtn.onmouseover = function () {
      closeBtn.style.background = "#334155";
      closeBtn.style.color = "#e2e8f0";
    };
    closeBtn.onmouseout = function () {
      closeBtn.style.background = "transparent";
      closeBtn.style.color = "#94a3b8";
    };
    closeBtn.onclick = function (e) {
      e.stopPropagation();
      closePopup();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    var body = document.createElement("div");
    body.setAttribute("data-popup-bridge-body", "true");
    body.style.cssText = "padding:20px;color:#94a3b8;font-size:0.9375rem;line-height:1.6;white-space:pre-wrap;";
    body.textContent = displayText;
    modal.appendChild(body);

    overlay.appendChild(modal);
    overlay.onclick = function (e) {
      if (e.target === overlay) closePopup();
    };
    modal.onclick = function (e) {
      e.stopPropagation();
    };

    container = overlay;
    document.body.appendChild(overlay);
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
