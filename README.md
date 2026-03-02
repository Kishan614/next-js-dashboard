# Dashboard App

Next.js dashboard with a toggle switch that controls a popup. When the toggle is on, a popup can appear on **any page** where you embed the bridge script (e.g. HubSpot pages).

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage on the dashboard

The dashboard does **not** show a popup. It only controls when and what appears on pages where you embed the script (e.g. HubSpot).

- **Show popup** – Toggle on to show the popup on those pages; toggle off to hide it.
- **Popup content** – Use the text area to set the message shown inside the popup. Content is saved automatically (debounced). Line breaks are preserved; use plain text only (no HTML).

## Showing the popup on HubSpot (or any other site)

The dashboard exposes an API that the bridge script polls. When the toggle is **on**, any page that loads the script will show the popup.

### 1. Deploy your dashboard

Deploy this Next.js app so it’s reachable at a public URL (e.g. `https://your-dashboard.vercel.app`). The script must be able to call `https://your-dashboard.vercel.app/api/popup-state` from the browser.

**Persistence:** Toggle and content are persisted so they survive restarts. The app uses **Upstash Redis** when `UPSTASH_REDIS_REST_URL` is set (recommended on Vercel); otherwise it uses a file (`data/popup-state.json`) on hosts with a writable filesystem (e.g. VPS, Railway).

#### Upstash Redis (recommended on Vercel)

1. In the [Vercel Dashboard](https://vercel.com/dashboard), open your project (or create one and connect this repo).
2. Go to **Storage** → **Create Database**, or install the [Upstash Redis integration](https://vercel.com/integrations/upstash) from the Vercel Marketplace (search “Redis” or “Upstash”).
3. Create a Redis database and connect it to your project. Vercel will add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project.
4. Redeploy. The app will persist popup state in Redis.

If you set env vars yourself (e.g. from [Upstash Console](https://console.upstash.com/)):

- `UPSTASH_REDIS_REST_URL` – your Redis REST URL (e.g. `https://xxx.upstash.io`)
- `UPSTASH_REDIS_REST_TOKEN` – your Redis REST token

Then run `npm install` (the `@upstash/redis` package is already in the repo).

### 2. Add the script on HubSpot

In HubSpot: **Settings → Website → Pages → Default page options**, or edit a specific page, and add **Custom HTML** (or use a tracking code / embed block). Use one of the options below.

**Option A – Script tag (hosted file)**  
Replace `https://your-dashboard.vercel.app` with your dashboard URL:

```html
<script>
  window.DASHBOARD_POPUP_API_URL = "https://your-dashboard.vercel.app";
</script>
<script src="https://your-dashboard.vercel.app/popup-bridge.js" async></script>
```

**Option B – Inline script (no extra file)**  
Replace `https://your-dashboard.vercel.app` with your dashboard URL and paste the full block. The popup body will show the **Popup content** you set in the dashboard.

```html
<script>
  (function () {
    var BASE = "https://your-dashboard.vercel.app".replace(/\/$/, "");
    var POLL_MS = 2000;
    var container = null;
    function fetchState() {
      return fetch(BASE + "/api/popup-state").then(function (r) { return r.json(); }).catch(function () { return { show: false, content: "" }; });
    }
    function hidePopup() { if (container && container.parentNode) container.parentNode.removeChild(container); container = null; }
    function getBodyEl() { return container && container.querySelector("[data-popup-body]"); }
    function showPopup(data) {
      var content = (data && typeof data.content === "string") ? data.content : "";
      var displayText = content.trim() || "Turn the switch off on the dashboard to close.";
      if (container && container.parentNode) {
        var bodyEl = getBodyEl();
        if (bodyEl) { bodyEl.textContent = displayText; bodyEl.style.whiteSpace = "pre-wrap"; }
        return;
      }
      var overlay = document.createElement("div");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:2147483647;padding:16px;";
      var modal = document.createElement("div");
      modal.style.cssText = "background:#1e293b;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);max-width:24rem;width:100%;border:1px solid #334155;";
      var header = document.createElement("div");
      header.style.cssText = "padding:16px 20px;border-bottom:1px solid #334155;";
      var title = document.createElement("h2");
      title.textContent = "Popup";
      title.style.cssText = "font-size:1.125rem;font-weight:600;color:#e2e8f0;margin:0;";
      header.appendChild(title);
      modal.appendChild(header);
      var body = document.createElement("div");
      body.setAttribute("data-popup-body", "true");
      body.style.cssText = "padding:20px;color:#94a3b8;font-size:0.9375rem;line-height:1.6;white-space:pre-wrap;";
      body.textContent = displayText;
      modal.appendChild(body);
      overlay.appendChild(modal);
      modal.onclick = function (e) { e.stopPropagation(); };
      container = overlay;
      document.body.appendChild(overlay);
    }
    function poll() { fetchState().then(function (d) { if (d.show) showPopup(d); else hidePopup(); }); }
    poll();
    setInterval(poll, POLL_MS);
  })();
</script>
```

### 3. Behaviour

- **Toggle ON** in the dashboard → script sees `show: true` on the next poll (every 2s) → popup appears on the HubSpot page with the **Popup content** from the dashboard.
- **Toggle OFF** in the dashboard → script sees `show: false` → popup is removed.
- **Popup content** – Whatever you type in the dashboard text area is saved and shown in the popup on HubSpot; updates are picked up on the next poll.
- The popup has no close button and cannot be closed by clicking the backdrop; it only closes when you turn the toggle **off** on the dashboard.
