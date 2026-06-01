# Anikoto Scraper API

A high-performance REST API for scraping anime data from [anikoto.net](https://anikoto.net), built with **Next.js 16**, **Cheerio**, and **Node-Cache** (in-memory caching).

> **For educational purposes only.** This project is not affiliated with anikoto.net.

---

## ✨ Features

- 12 REST endpoints covering home, search, filter, anime detail, episodes, schedule, streaming sources, and a streaming proxy
- Response envelope — every response is `{ ok: true, data: ... }` or `{ ok: false, message: "..." }`
- In-memory cache (TTL per endpoint) — add `?refresh=1` to any request to bypass
- Interactive **Swagger UI** docs at `/` powered by an OpenAPI 3.0 spec (`public/openapi.yaml`)
- TypeScript — fully typed responses via `src/lib/types.ts`

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the interactive API docs.

---

## 📖 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/home` | Home data: spotlight, latest eps, top anime |
| GET | `/api/search?keyword=` | Search anime by keyword |
| GET | `/api/filter` | Advanced multi-param filter |
| GET | `/api/anime/:slug` | Anime detail info |
| GET | `/api/anime/:slug/episodes` | Episode list (with range filter) |
| GET | `/api/latest` | Latest / popular anime listing |
| GET | `/api/status` | Browse by airing status |
| GET | `/api/genre/:genre` | Browse by genre |
| GET | `/api/type/:type` | Browse by media type |
| GET | `/api/schedule` | Weekly airing schedule |
| GET | `/api/watch/:slug?ep=` | Streaming sources (m3u8 + subs) |
| GET | `/api/proxy?url=` | Streaming proxy (CORS bypass) |

See the **full interactive documentation** at [`/`](http://localhost:3000) or in [`public/openapi.yaml`](./public/openapi.yaml).

---

## ⚡ Cache TTL

| Endpoint | TTL |
|----------|-----|
| `/api/home` | 5 minutes |
| `/api/anime/:slug` | 30 minutes |
| `/api/search` | 2 minutes |
| `/api/filter` | 5 minutes |
| `/api/schedule` | 1 hour |
| Episodes | 10 minutes |

Add `?refresh=1` to force a fresh scrape.

---

## ☁️ Cloudflare Worker Proxy (Optional)

By default, the API provides an internal streaming proxy at `/api/proxy` to bypass CORS. For better performance and free unlimited bandwidth (100k req/day free tier), you can deploy the included Cloudflare Worker and configure the API to use it automatically.

1. Deploy the worker from the `cloudflare-worker/` directory:
   ```bash
   cd cloudflare-worker
   npm install wrangler -g
   wrangler deploy
   ```
2. Add your worker URL as an environment variable in a `.env` file at the root of the project:
   ```env
   CF_WORKER_URL=https://your-worker-name.workers.dev
   ```
   *Note: When this environment variable is set, the `/api/watch` endpoint will automatically return proxy URLs pointing to your Cloudflare Worker instead of the internal `/api/proxy`.*

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx          # Swagger UI documentation page
│   ├── layout.tsx        # Root layout
│   └── api/              # API route handlers
│       ├── home/         # GET /api/home
│       ├── search/       # GET /api/search
│       ├── filter/       # GET /api/filter
│       ├── anime/        # GET /api/anime/:slug (+ /episodes)
│       ├── latest/       # GET /api/latest
│       ├── status/       # GET /api/status
│       ├── genre/        # GET /api/genre/:genre
│       ├── type/         # GET /api/type/:type
│       ├── schedule/     # GET /api/schedule
│       ├── watch/        # GET /api/watch/:slug
│       ├── proxy/        # GET /api/proxy
│       └── sources/      # Streaming source resolvers
├── lib/
│   ├── types.ts          # TypeScript interfaces
│   ├── constants.ts      # Base URL, cache TTLs, filter options
│   ├── cache.ts          # Node-Cache instance
│   ├── fetcher.ts        # Axios-based HTML fetcher
│   ├── extractors.ts     # Cheerio extraction helpers
│   └── scrapers/         # Per-endpoint scraping logic
public/
└── openapi.yaml          # OpenAPI 3.0 specification
```

---

## 🛠️ Tech Stack

- [Next.js 16](https://nextjs.org) — App Router
- [Cheerio](https://cheerio.js.org) — server-side HTML parsing
- [Axios](https://axios-http.com) — HTTP client
- [Node-Cache](https://www.npmjs.com/package/node-cache) — in-memory caching
- [Swagger UI](https://swagger.io/tools/swagger-ui/) — interactive API docs

---

## 👤 Author

**Teramoto** · [github.com/Teramoto669](https://github.com/Teramoto669)
