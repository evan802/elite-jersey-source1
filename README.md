# Elite Jersey — Complete Source Code

The full source for George Yermak's jersey store (elite_jersey_us on eBay).
Built by TouchBridge Studios.

## What's inside

```
elite-jersey-source/
├── README.md                          ← you are here
│
├── standalone/                        ← PLUG-AND-PLAY VERSION (no build tools)
│   ├── index.html                     — full page structure
│   ├── css/style.css                  — complete design system
│   └── js/main.js                     — all store logic, vanilla JS
│
├── react-app/                         ← THE REAL PRODUCTION CODE (React + TypeScript)
│   ├── pages/
│   │   ├── EliteJerseyStorePage.tsx   — storefront: home / club / item views, checkout, offers (1,055 lines)
│   │   ├── EjHomeSections.tsx         — hero, team wall, club pages, product cards, 30-club registry (1,362 lines)
│   │   ├── EliteJerseyAdminPage.tsx   — George's Seller Hub: listings, orders, offers, stats (627 lines)
│   │   └── EjBrand.tsx                — shared logo/brand mark (53 lines)
│   └── lib/
│       └── elitejersey.ts             — typed API client: items, orders, offers, admin calls (246 lines)
│
└── backend/
    └── elite-jersey.ts                — Cloudflare Durable Object backend: catalog, per-size stock,
                                         orders w/ restocking, offers, admin auth (478 lines)
```

## The two front-ends

**standalone/** is a dependency-free rebuild of the storefront. Open `index.html`
in a browser or drop the folder on any static host (Netlify, GoDaddy, S3…) and
it works. It talks to the same live backend, so the catalog, stock, checkout,
and offers stay in sync with the Seller Hub.

**react-app/** is the production code that runs at tbsites.com/ej. It expects
the TouchBridge web app around it (React 18, TanStack Query, framer-motion,
lucide-react, Tailwind). File paths in imports follow the production layout:

- `@/lib/elitejersey`        → react-app/lib/elitejersey.ts
- `@/pages/elitejersey/...`  → react-app/pages/...

## The backend

`backend/elite-jersey.ts` runs inside a Cloudflare Durable Object (SQLite
storage) and is mounted under `/ej/*`:

| Route                         | Method | What it does                                  |
|-------------------------------|--------|-----------------------------------------------|
| /ej/items                     | GET    | Active listings (thumbnail payload)           |
| /ej/items/:id                 | GET    | Full listing + view counter                   |
| /ej/orders                    | POST   | Place order — validates per-size stock        |
| /ej/interest                  | POST   | Make an offer / ask a question                |
| /ej/admin/login               | POST   | Seller Hub login                              |
| /ej/admin/summary             | GET    | Listings + orders + offers + revenue stats    |
| /ej/admin/items               | POST   | Create listing (10-photo limit)               |
| /ej/admin/items/:id           | POST   | Update listing                                |
| /ej/admin/items/:id/delete    | POST   | Delete listing                                |
| /ej/admin/orders/:id          | POST   | Update order status (cancelling restocks)     |
| /ej/admin/interest/:id/delete | POST   | Dismiss an offer                              |

Admin routes authenticate with the `X-EJ-Admin` header.

Live API base: `https://tbstudios-backend.rork.app`

## Key mechanics

- **Per-size stock** — each listing can carry `sizeStock` (e.g. `{"M": 2, "L": 1}`);
  totals derive from it, checkout validates against it, and cancelled orders restock it.
- **Orders take no payment online** — George confirms payment (PayPal/Venmo/Zelle)
  by email from the Seller Hub.
- **Club detection** — listings are auto-sorted onto team rails by title keywords
  (30 clubs/countries with crests and colors, `detectClub()` in both front-ends).
- **Images** — stored as data URLs in SQLite; hard 1.8MB ceiling per listing keeps
  rows under the Durable Object 2MB limit.

© TouchBridge Studios — built for George Yermak / Elite Jersey.
