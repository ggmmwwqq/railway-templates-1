<p align="center">
  <a href="https://railway.com/template/pocketbase" target="_blank">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" height="40">
  </a>
</p>

# PocketBase Instant Backend

**The easiest way to run PocketBase on Railway.** Deploy in under 2 minutes. Zero config.

---

## What is this?

A one-click template that gives you a complete backend — database, auth, file storage, admin panel, and REST API. Built on [PocketBase](https://pocketbase.io), wrapped for production on Railway.

## Why it exists

Setting up a backend takes hours. Database, API, auth, file uploads, deployment. This template collapses all of that into one click. You get a real production backend, not a demo.

---

## Deploy

<p align="center">
  <a href="https://railway.com/template/pocketbase" target="_blank">
    <img src="https://railway.com/button.svg" alt="Deploy on Railway" width="180">
  </a>
</p>

1. **Click the button** — Railway creates your project
2. **Wait ~90 seconds** — builds and deploys automatically
3. **Open your URL** — see the landing page with status and links

That's it. No configuration. No setup.

---

## What You Get

A full PocketBase backend behind a lightweight proxy:

| What | Where |
|------|-------|
| Landing page | `/` |
| System status | `/system` |
| Health check | `/health` |
| Admin panel | `/_/` |
| REST API | `/api/` |

The proxy handles routing, health checks, and status pages. PocketBase runs securely on an internal port.

---

## Access the Admin Panel

Open your app URL and click **Open Admin Panel**, or go directly to `/_/`.

**First visit:** PocketBase shows a "Create Admin" screen. Enter email + password. Done.

You can also set `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` as environment variables before deploy to auto-create the account.

---

## Persistent Storage

By default, data is stored at `/pb_data` inside the container. **Without a volume, data is lost on redeploy.**

### Add a Railway Volume

1. In Railway Dashboard, go to your service
2. Click **Volumes** → **Add Volume**
3. Mount path: `/pb_data`
4. Deploy

The system status page at `/system` shows whether storage is connected.

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `8080` | Public HTTP port |
| `PB_INTERNAL_PORT` | No | `8090` | PocketBase internal port |
| `PB_DATA_DIR` | No | `/pb_data` | Data directory |
| `PB_ENCRYPTION_KEY` | Recommended | — | Encrypts stored secrets |
| `PB_ADMIN_EMAIL` | No | — | Auto-create admin email |
| `PB_ADMIN_PASSWORD` | No | — | Auto-create admin password |

The template works immediately with zero variables. Set `PB_ENCRYPTION_KEY` for production.

Generate a key:
```bash
openssl rand -base64 32
```

---

## Connecting a Frontend

```bash
npm install pocketbase
```

```ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://your-app.railway.app');

// Fetch records
const posts = await pb.collection('posts').getList(1, 20);

// Authenticate
await pb.collection('users').authWithPassword('email', 'password');
```

---

## Local Development

```bash
git clone https://github.com/ggmmwwqq/railway-templates-1
cd railway-templates-1
docker compose up
```

Open `http://localhost:8080`.

---

## Troubleshooting

**Admin panel not loading?**
Wait 30 seconds and refresh. PocketBase initializes the database on first start.

**Data lost after redeploy?**
You need a Railway Volume at `/pb_data`. Check `/system` — it shows storage status.

**CORS errors from frontend?**
Go to PocketBase Admin (`/_/`) → Settings → add your frontend origin.

---

## FAQ

**Production ready?**
Yes. Set `PB_ENCRYPTION_KEY`, add a volume, configure API rules in the admin panel. PocketBase powers thousands of production apps.

**Can I switch to PostgreSQL?**
Yes. See [PocketBase docs](https://pocketbase.io/docs/).

**How do I update PocketBase?**
Change `ARG PB_VERSION` in the Dockerfile and rebuild.

**How do I back up?**
Copy `/pb_data` from the volume. Railway provides snapshot backups on paid plans.

**Custom domain?**
Railway Dashboard → Service → Settings → Public Networking → Custom Domain.

---

## Architecture

```
User → PORT 8080 → Proxy (Node.js)
                      ├─ /, /system, /health → served directly
                      └─ /_/, /api/* → PocketBase (127.0.0.1:8090)
                                           └─ /pb_data (volume)
```

---

MIT &middot; Built with [PocketBase](https://pocketbase.io) + [Railway](https://railway.com)
