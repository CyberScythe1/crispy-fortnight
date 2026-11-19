# Railway.com Deployment Guide

This guide deploys the Crispy Fortnight monorepo (4 services + 2 managed databases) to Railway.

## Architecture

```
Railway Project
├── PostgreSQL (managed plugin)     → single instance, 2 databases
├── Redis (managed plugin)
├── fs04-backend   (Docker, port 4001)
├── fs04-frontend  (Docker, port 3001)
├── fs02-backend   (Docker, port 4002 + WS 4003)
└── fs02-frontend  (Docker, port 3002)
```

## Prerequisites

1. Railway account at [railway.com](https://railway.com)
2. GitHub repo connected: `https://github.com/CyberScythe1/crispy-fortnight.git`
3. Railway CLI (optional): `npm i -g @railway/cli`

---

## Step 1: Create Railway Project

1. Go to [railway.com/new](https://railway.com/new)
2. Select **Deploy from GitHub repo** → choose `CyberScythe1/crispy-fortnight`
3. Railway will detect 4 Dockerfiles. Don't auto-deploy yet — we need databases first.

## Step 2: Add Managed Databases

### PostgreSQL
1. In your Railway project → **New → Database → PostgreSQL**
2. Once provisioned, click it → **Connect** tab → note the **Connection URL** (e.g. `postgresql://postgres:pass@turntable.db.e2fsdfs.e2fsdfs.eu-central-1.railway.app:6543/railway`)
3. We need **two databases** on this instance. Railway's managed Postgres allows this via psql:
   ```bash
   # Connect to the Railway Postgres instance
   psql "postgresql://postgres:PASS@HOST:PORT/railway"
   
   CREATE DATABASE fs04_pm;
   CREATE DATABASE fs02_collab;
   ```
4. Your two `DATABASE_URL` values will be:
   - FS-04: `postgresql://postgres:PASS@HOST:PORT/fs04_pm`
   - FS-02: `postgresql://postgres:PASS@HOST:PORT/fs02_collab`

### Redis
1. **New → Database → Redis**
2. Note the **Connection URL** (e.g. `redis://default:pass@redis.railway.app:6379`)

---

## Step 3: Deploy FS-04 Backend

1. **New → GitHub Repo → crispy-fortnight**
2. Set **Root Directory**: `packages/fs04-multi-tenant-pm/backend`
   - Wait — the backend Dockerfile needs the repo root as build context (it copies `packages/shared`).
   - Instead: **New → Empty Service**, then configure:
     - **Build → Dockerfile path**: `packages/fs04-multi-tenant-pm/backend/Dockerfile`
     - **Build → Context**: `/` (repo root)
3. Or use Railway CLI:
   ```bash
   railway link  # select your project
   railway add   # name it fs04-backend
   railway up --service fs04-backend
   ```
4. Set environment variables (Railway dashboard → service → Variables):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4001` |
   | `DATABASE_URL` | `postgresql://postgres:PASS@HOST:PORT/fs04_pm` |
   | `REDIS_URL` | `redis://default:PASS@HOST:PORT` |
   | `JWT_SECRET` | `<32+ char random string>` |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...`) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
   | `CORS_ORIGIN` | `https://fs04-frontend-PRODUCTION_URL.up.railway.app` |

5. Railway will build and deploy. The Dockerfile runs `prisma migrate deploy && prisma generate && npm start`.

6. Once deployed, note the public URL: `https://fs04-backend-xxx.up.railway.app`

---

## Step 4: Deploy FS-04 Frontend

1. **New → GitHub Repo → crispy-fortnight**
2. This Dockerfile's context is `packages/fs04-multi-tenant-pm/frontend` (self-contained, no shared package needed).
3. Set **Root Directory**: `packages/fs04-multi-tenant-pm/frontend`
4. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://fs04-backend-xxx.up.railway.app/api/v1` |
   | `VITE_WS_URL` | `wss://fs04-backend-xxx.up.railway.app` |

5. The frontend builds with vite and serves static files via `serve` on port 3001.
6. Once deployed, note the public URL: `https://fs04-frontend-xxx.up.railway.app`

7. **Go back to fs04-backend** and update `CORS_ORIGIN` to the frontend URL above.

---

## Step 5: Deploy FS-02 Backend

1. **New → Empty Service** (same context issue as fs04-backend)
   - **Dockerfile path**: `packages/fs02-realtime-collab/backend/Dockerfile`
   - **Context**: `/` (repo root)
2. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4002` |
   | `WS_PORT` | `4003` |
   | `DATABASE_URL` | `postgresql://postgres:PASS@HOST:PORT/fs02_collab` |
   | `REDIS_URL` | `redis://default:PASS@HOST:PORT` |
   | `JWT_SECRET` | `<same 32+ char string as fs04>` |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | `https://fs02-frontend-xxx.up.railway.app` |

3. The Dockerfile runs `prisma db push && prisma generate && npm start`.
4. Once deployed, note the public URL: `https://fs02-backend-xxx.up.railway.app`

> **Note on WebSocket**: Railway routes both HTTP and WS through the same port (443). Set `WS_PORT=4002` so the YJS WebSocket server runs on the same port as Express. Alternatively, if the WS server binds separately, Railway will proxy `wss://` to the exposed port.

---

## Step 6: Deploy FS-02 Frontend

1. **New → GitHub Repo → crispy-fortnight**
2. Set **Root Directory**: `packages/fs02-realtime-collab/frontend`
3. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://fs02-backend-xxx.up.railway.app/api/v1` |
   | `VITE_WS_URL` | `https://fs02-backend-xxx.up.railway.app` |

4. Once deployed, note the public URL: `https://fs02-frontend-xxx.up.railway.app`

5. **Go back to fs02-backend** and update `CORS_ORIGIN` to the frontend URL above.

---

## Step 7: Create Demo Users

After all services are deployed, create demo users by hitting the register endpoints:

### FS-04
```bash
curl -X POST https://fs04-backend-xxx.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fs04.local","password":"password123","firstName":"Demo","lastName":"User"}'
```

### FS-02
```bash
curl -X POST https://fs02-backend-xxx.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fs02.local","password":"password123","firstName":"Demo","lastName":"User"}'
```

Then log in via the frontend "Try Demo Account" buttons.

---

## Environment Variable Summary

### Shared (both backends)
- `JWT_SECRET` — same value for both (32+ chars)
- `REDIS_URL` — Railway Redis connection URL
- `NODE_ENV=production`

### FS-04 Backend
- `DATABASE_URL` — Postgres URL with `/fs04_pm` database
- `PORT=4001`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `CORS_ORIGIN` — fs04 frontend URL

### FS-04 Frontend
- `VITE_API_URL` — `https://<fs04-backend>.up.railway.app/api/v1`
- `VITE_WS_URL` — `https://<fs04-backend>.up.railway.app`

### FS-02 Backend
- `DATABASE_URL` — Postgres URL with `/fs02_collab` database
- `PORT=4002`, `WS_PORT=4003`
- `CORS_ORIGIN` — fs02 frontend URL

### FS-02 Frontend
- `VITE_API_URL` — `https://<fs02-backend>.up.railway.app/api/v1`
- `VITE_WS_URL` — `https://<fs02-backend>.up.railway.app`

---

## Railway CLI Alternative

Instead of the dashboard, you can use the CLI:

```bash
npm i -g @railway/cli
railway login

# Create project
railway init  # name: crispy-fortnight

# Add databases
railway add --plugin postgresql
railway add --plugin redis

# Create databases via psql (see Step 2)
# ...

# Deploy services
railway up --service fs04-backend
railway up --service fs04-frontend
railway up --service fs02-backend
railway up --service fs02-frontend

# Set variables
railway variables --service fs04-backend NODE_ENV=production PORT=4001 ...
```

---

## Troubleshooting

### Frontend can't reach backend
- Ensure `VITE_API_URL` is the **full Railway public URL** (not a Docker network name)
- `VITE_*` vars are **build-time** — Railway rebuilds when you change them
- Check browser console for CORS errors → verify `CORS_ORIGIN` on backend matches the exact frontend URL

### Prisma migration fails
- FS-04 uses `prisma migrate deploy` — requires `prisma/migrations/` folder (included in Docker context)
- FS-02 uses `prisma db push` — syncs schema directly, no migration files needed
- Verify `DATABASE_URL` points to the correct database (`/fs04_pm` or `/fs02_collab`)

### WebSocket not connecting
- Railway proxies `wss://` to your service's exposed port
- Ensure the WS server listens on `PORT` (not a separate port) — Railway only exposes one port per service
- For FS-02: the YJS WS server may need to run on the same port as Express (4002). Check `server.js` to see if it binds separately on `WS_PORT`.

### Build fails (shared package not found)
- Backend Dockerfiles copy `packages/shared` from repo root — the build context must be `/` not the backend directory
- In Railway: set the service's **Root Directory** to `/` and **Dockerfile path** to `packages/.../backend/Dockerfile`

### Port detection
- Railway auto-detects the `PORT` env var. Set `PORT=4001` (fs04-backend), `PORT=4002` (fs02-backend), and Railway will route traffic to that port.
- Frontends use `serve -s dist -l 3001` / `-l 3002` — Railway will detect the listening port automatically.
