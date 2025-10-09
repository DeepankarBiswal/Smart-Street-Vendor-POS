# Smart Vendor POS

A mobile‑first, offline‑capable Point of Sale (POS) web app for street and small food vendors. It supports fast item entry, live cart totals with discount and tax, checkout (Cash/UPI), 
persistent order history, and a daily summary dashboard. Built with HTML, Tailwind CSS, and vanilla JavaScript; data persists locally and works offline via a Service Worker.

## Demo highlights
- Quick item grid with category tabs and search.
- Cart drawer with +/−/remove, discount %, tax %, and auto‑recalculated totals.
- One‑tap checkout (Cash/UPI) that saves an order snapshot.
- Daily Summary page with revenue, order count, average ticket, items sold, and top items.

## Features
- Offline‑first: Caches the app shell and seed catalog; continues to work without network.
- Safe money math: All calculations use integer paise to avoid floating‑point errors.
- Persistent config: Discount and tax percentages saved across sessions.
- Local order store: Orders kept in localStorage with simple querying by date.
- Clean, responsive UI: Tailwind CSS and accessible, mobile‑friendly patterns.

## Tech stack
- Frontend: HTML, Tailwind CSS (CDN), vanilla JS modules.
- Storage: Indexed localStorage for orders and config; static JSON for catalog.
- Offline: Service Worker with cache‑first shell and stale‑while‑revalidate for catalog.

## Project structure
```
frontend/
  index.html           # POS screen
  summary.html         # Daily summary dashboard
  sw.js                # Service Worker (offline caching)
  src/
    app.js             # App bootstrap, UI wiring
    catalog.js         # Catalog loading, filtering, rendering
    cart.js            # Cart model and operations
    orders.js          # Order persistence, totals, config (tax/discount)
    money.js           # INR formatting and integer money helpers
    summary.js         # Summary page aggregation & rendering
    assets/
      items.json       # Seed catalog (id, name, category, pricePaise)
```

## Getting started
1) Clone the repo and open the frontend folder in VS Code.
2) Serve locally with any static server:
- VS Code Live Server (recommended for quick start).
- Or: run “npx serve” inside frontend and open the shown URL.
3) Open index.html to use the POS.
4) Open summary.html to view daily reports.

Notes:
- Service Worker registration expects sw.js in the same folder as index.html and summary.html.
- If serving from a subpath, adjust paths in sw.js CORE_ASSETS accordingly.

## Usage
- Add items: Tap items in the grid to add to cart; use +/− or Remove in the drawer.
- Discounts/Tax: Set percentage values in the cart; totals update instantly and persist.
- Checkout: Choose Cash or UPI; an order snapshot is saved and the cart clears.
- Summary: Go to summary.html, pick a date, and Refresh to see KPIs and top items.

## Configuration
- Tax and discount percentages are stored under key “svpos.config.v1”.
- Orders are stored under key “svpos.orders.v1”.
- Catalog lives in src/assets/items.json; add/edit items with fields:
```json
{ "id": "itm_example", "name": "Example", "category": "Snacks", "pricePaise": 250 }
```

## Offline behavior
- First load online installs the Service Worker and caches core files.
- Subsequent loads will work offline (app shell, catalog, UI).
- LocalStorage ensures orders/config persist without a backend.

## Implementation notes
- Money handling uses integer paise for totals: compute discount, taxable, tax, and total as integers.
- Idempotent order IDs: “ord_<timestamp>_<random>”.
- Catalog filtering: category tabs + client‑side search.

## Roadmap
- Auth PIN for vendor/admin actions.
- CSV export of orders and PDF receipt generation.
- Simple sync API (Java/Spring or Javalin) with idempotent writes.
- Inventory stock counts and low‑stock alerts.
- Basic customer tagging on orders.

## Scripts and paths
- Service Worker caches:
  - index.html, summary.html
  - src/app.js, catalog.js, cart.js, orders.js, money.js, summary.js
  - src/assets/items.json
- If paths differ in deployment, update CORE_ASSETS in sw.js and bump CACHE_NAME.

## Accessibility
- Keyboard‑focusable controls for item buttons and cart actions.
- Clear text contrast and touch‑friendly hit targets.
- Live total updates reflected in visible labels.

## Screenshots
- POS screen: item grid, header total, cart drawer.
- Summary screen: KPIs and top items.

## License
- MIT (or choose a preferred license).

## Acknowledgments
- Tailwind CSS for rapid UI styling.

If a short tagline is needed for the repo description:
“Offline‑capable POS for street vendors with live cart totals, daily summaries, and zero backend.”
