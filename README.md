<p align="center">
  <a href="https://railway.com/template/pocketbase" target="_blank">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" height="40">
  </a>
</p>

<p align="center">
  <strong>Deploy a production backend in 60 seconds.</strong><br>
  No setup. No config. No headache.
</p>

---

## What is this?

**Instant Backend** gives you a fully operational backend — database, authentication, file storage, admin panel, and REST API — in one click.

It wraps [PocketBase](https://pocketbase.io) (an open-source Firebase alternative) with a production-ready Docker container, health monitoring, and zero-config Railway deployment. You get a real backend. Not a demo. Not a mock. A production backend you can use for your SaaS, mobile app, bot, or internal tool.

### The Problem

Every project needs a backend. But setting one up means choosing a database, writing an API, configuring auth, handling file uploads, setting up monitoring, and deploying it somewhere. That's days of work before you write a single line of product code.

### The Solution

Click deploy. Wait 60 seconds. You have:

- A database (SQLite, with automatic persistence)
- A REST API (auto-generated from your data model)
- Authentication (email/password, OAuth2 with 50+ providers)
- File storage (with automatic thumbnail generation)
- An admin dashboard (manage everything visually)
- Real-time subscriptions (WebSocket-based)
- Health monitoring (metrics, uptime, ready checks)

Start building your product immediately.

---

## Features

| | Feature |
|---|--------|
|  | **One-click deploy** — works on Railway free plan |
|  | **Persistent database** — Railway Volume, survives redeploys |
|  | **Admin dashboard** — manage collections, users, files visually |
|  | **Auto-generated REST API** — full CRUD from your data model |
|  | **Authentication** — email/password + 50+ OAuth2 providers (Google, GitHub, etc.) |
|  | **File storage** — upload, resize, serve files with automatic thumbnails |
|  | **Real-time** — WebSocket subscriptions for live updates |
|  | **Health monitoring** — `/healthcheck`, `/ready`, `/metrics` endpoints |
|  | **Zero dependencies** — PocketBase binary + lightweight health sidecar |
|  | **Alpine Linux** — minimal image, fast startup, low resource usage |

---

## Quick Start

### One-Click Deploy

<p align="center">
  <a href="https://railway.com/template/pocketbase" target="_blank">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" width="180">
  </a>
</p>

1. Click the button above
2. Wait ~60 seconds
3. Open `https://your-app.railway.app/_/` — done

That's it. Your backend is live. No manual configuration required.

### Local Development

```bash
git clone https://github.com/your-org/instant-backend
cd instant-backend
docker compose up
```

Open `http://localhost:8080/_/` to access the admin panel.

---

## Use Cases

### SaaS Backend
User authentication, subscription tracking, user-generated content, real-time dashboards. PocketBase handles the heavy lifting — you focus on your product.

### Mobile App Backend
REST API for iOS/Android. File uploads for user content. Push notification support. Works with any mobile framework (React Native, Flutter, Swift, Kotlin).

### API for Bots
Telegram, Discord, Slack — any bot that needs a lightweight backend. Webhook handling, user state persistence, quick iteration.

### Internal Tools & CRM
Custom admin panels. Role-based access. Quick prototyping. Data export. Scale from prototype to production without changing tools.

### Microservice Backend
Need a fast, self-contained backend for a specific service? Deploy one in 60 seconds. No overhead. No complex orchestration.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Docker (Alpine)                      │
│                                                       │
│   ┌──────────────┐          ┌──────────────────┐     │
│   │  PocketBase  │          │  Health Sidecar   │     │
│   │  Port 8080   │          │  Port 8090        │     │
│   │              │          │                   │     │
│   │  Admin UI    │          │  /healthcheck     │     │
│   │  REST API    │          │  /ready           │     │
│   │  Auth        │          │  /metrics         │     │
│   │  Realtime    │          │                   │     │
│   └──────┬───────┘          └──────────────────┘     │
│          │                                            │
│   ┌──────▼────────────────────────────────────────┐  │
│   │          Railway Persistent Volume             │  │
│   │              /pb_data                          │  │
│   │                                                │  │
│   │    SQLite DB  │  Uploaded Files  │  Settings   │  │
│   └───────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**PocketBase** serves the admin panel, API, auth, and real-time subscriptions.  
**Health Sidecar** monitors PocketBase and reports readiness to Railway.  
**Persistent Volume** ensures your data survives every restart and deploy.

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `8080` | Main HTTP port (Railway injects automatically) |
| `SIDECAR_PORT` | No | `8090` | Health monitoring port |
| `PB_DATA_DIR` | No | `/pb_data` | Data directory (SQLite + files) |
| `PB_ENCRYPTION_KEY` | Recommended | — | Encrypts stored secrets. Generate with `openssl rand -base64 32` |
| `PB_ADMIN_EMAIL` | No | — | Auto-create admin on first deploy |
| `PB_ADMIN_PASSWORD` | No | — | Admin password (requires `PB_ADMIN_EMAIL`) |

Set these in **Railway Dashboard > Your Service > Variables**.

---

## Connecting a Frontend

### Next.js (App Router)

```bash
npm install pocketbase
```

```typescript
// lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);

// Optional: server-side auth
export function createServerClient() {
  return new PocketBase(process.env.PB_URL!);
}
```

```typescript
// app/page.tsx
import { pb } from '@/lib/pocketbase';

export default async function Home() {
  const posts = await pb.collection('posts').getList(1, 20, {
    sort: '-created',
  });

  return (
    <main>
      <h1>Latest Posts</h1>
      {posts.items.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </main>
  );
}
```

---

## FAQ

**Is this production-ready?**
Yes. Set `PB_ENCRYPTION_KEY`, enable auth providers in the admin panel, and configure API rules. PocketBase powers thousands of production applications.

**Can I use PostgreSQL instead of SQLite?**
Yes. PocketBase supports PostgreSQL as an alternative. See the [PocketBase docs](https://pocketbase.io/docs/).

**Does it work on Railway free plan?**
Yes. The free plan includes enough resources (512 MB RAM, shared CPU) for most PocketBase workloads. Upgrade if you need more storage or performance.

**How do I back up my data?**
The Railway Volume at `/pb_data` contains everything. Use Railway's snapshot feature, or run `pocketbase backup` to export your database.

**Can I add custom server-side logic?**
Yes. PocketBase supports JavaScript hooks and Go extensions. Add them to `pb_hooks/` in your data directory or via the admin panel.

**How do I configure CORS?**
Go to the PocketBase admin panel at `/_/#/settings` and add your frontend origin under CORS settings. For development, you can allow all origins temporarily.

**What if PocketBase updates?**
Update the `PB_VERSION` build arg in `Dockerfile`, rebuild, and redeploy. Your data is safe on the persistent volume.

---

## Customizing

### Update PocketBase Version

```dockerfile
# Dockerfile — line 1
ARG PB_VERSION=0.24.0  # Change this
```

### Add Custom Domain

In Railway Dashboard: Service > Settings > Public Networking > Custom Domain.

### Add Extensions

PocketBase supports JavaScript hooks and Go extensions. Place hooks in `pb_hooks/` within your data directory.

---

## Repository Structure

```
.
├── Dockerfile              # Multi-stage Alpine build
├── start.sh                # Entrypoint — starts PB + health sidecar
├── railway.toml            # Railway deployment config
├── docker-compose.yml      # Local development
├── .env.example            # Documented environment variables
├── healthcheck/
│   └── index.mjs           # Zero-dependency health sidecar
└── .github/                # Issue templates, funding config
```

---

## Keywords

`backend` `saas` `pocketbase` `railway` `api` `starter-kit` `boilerplate` `firebase-alternative` `baas` `self-hosted` `docker` `sqlite` `production-ready` `one-click-deploy`

---

**License:** MIT

**Built with:** [PocketBase](https://pocketbase.io) &middot; [Railway](https://railway.com) &middot; [Alpine Linux](https://alpinelinux.org)
