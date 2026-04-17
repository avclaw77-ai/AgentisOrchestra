# Security Backlog

**Last updated**: 2026-04-17
**Status**: All MEDIUM items fixed. 2 LOW items remaining (L1, L2).

---

## MEDIUM Priority (ALL FIXED)

### M1: Rate-limit `/api/setup/test-provider` -- FIXED

**Risk**: This endpoint is in PUBLIC_PATHS (accessible pre-auth) and makes external API calls with user-supplied keys. An attacker could use it as a proxy to validate stolen API keys at no cost.

**Fix**: Add IP-based rate limiting (e.g., 5 requests per minute per IP). Options:
- Next.js middleware with in-memory rate counter
- Upstash Redis rate limiter (`@upstash/ratelimit`)
- Move endpoint out of PUBLIC_PATHS after setup is complete

**Files**: `app/src/app/api/setup/test-provider/route.ts`, `app/src/middleware.ts`

---

### M2: Add `getSessionUser()` to remaining API routes -- FIXED

**Risk**: These routes rely only on middleware cookie-presence check (edge runtime can't do DB validation). If an attacker sets an arbitrary cookie value, middleware passes but DB lookup fails gracefully. Defense-in-depth says we should validate at the route level too.

**Routes needing auth guards**:
- `app/src/app/api/tasks/route.ts`
- `app/src/app/api/tasks/[id]/route.ts`
- `app/src/app/api/tasks/[id]/comments/route.ts`
- `app/src/app/api/chat/messages/route.ts`
- `app/src/app/api/goals/route.ts`
- `app/src/app/api/costs/route.ts`
- `app/src/app/api/costs/budget/route.ts`
- `app/src/app/api/routines/route.ts`
- `app/src/app/api/routines/[id]/route.ts`
- `app/src/app/api/routines/[id]/runs/route.ts`
- `app/src/app/api/decisions/route.ts`
- `app/src/app/api/activity/route.ts`
- `app/src/app/api/models/route.ts`
- `app/src/app/api/plugins/route.ts`
- `app/src/app/api/skills/route.ts`
- `app/src/app/api/approvals/route.ts`
- `app/src/app/api/approvals/[id]/comments/route.ts`
- `app/src/app/api/agents/[id]/config/route.ts`
- `app/src/app/api/agents/[id]/heartbeat/route.ts`
- `app/src/app/api/agents/[id]/analyze/route.ts`
- `app/src/app/api/agents/[id]/skills/route.ts`
- `app/src/app/api/agents/[id]/runs/route.ts`
- `app/src/app/api/agents/[id]/stats/route.ts`
- `app/src/app/api/company/export/route.ts`
- `app/src/app/api/company/import/route.ts`

**Fix**: Add `const user = await getSessionUser(); if (!user) return 401;` to each handler. Consider a shared wrapper to reduce boilerplate.

---

### M3: ENCRYPTION_KEY validation on startup -- FIXED

**Risk**: If a user copies `.env.example` and forgets to replace the placeholder `REPLACE_ME_run_openssl_rand_hex_32`, the app will fail on first encrypt -- but the error message won't be obvious.

**Fix**: Add startup validation in both `app` and `bridge` that checks ENCRYPTION_KEY length (64 hex chars) and logs a clear error message with the generation command.

**Files**: `app/src/lib/crypto.ts`, `bridge/crypto.ts`

---

## LOW Priority

### L1: Bridge + MCP ports exposed to host in dev compose

**Risk**: In development, `docker-compose.yml` exposes bridge (3847) and MCP (3848) ports to the host. If dev compose is accidentally used on a VPS, these internal services become reachable.

**Fix**: Bind to loopback in dev compose: `127.0.0.1:3847:3847`. Prod compose (`docker-compose.prod.yml` if created) should not expose these at all -- app communicates via Docker network.

**Files**: `docker-compose.yml`

---

### L2: Session token rotation

**Risk**: Sessions last 30 days with no rotation. If a session token is compromised, it remains valid for the full duration.

**Fix**: Implement sliding window rotation -- on each authenticated request, if the session is >24h old, issue a new token and invalidate the old one.

**Files**: `app/src/lib/auth.ts`, `app/src/app/api/auth/route.ts`

---

### L3: CSP headers -- FIXED

**Risk**: No Content-Security-Policy headers are set. XSS protection relies entirely on React's built-in escaping.

**Fix**: Add CSP headers via `next.config.ts` or middleware. At minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`.

**Files**: `app/next.config.ts` or `app/src/middleware.ts`

---

## Already Fixed (2026-04-17)

| Issue | Severity | Fix |
|-------|----------|-----|
| M1: test-provider rate limit | MEDIUM | 5 req/min per IP, in-memory rate limiter |
| M2: Auth guards on 25 API routes | MEDIUM | `getSessionUser()` defense-in-depth on all handlers |
| M3: ENCRYPTION_KEY validation | MEDIUM | Startup check with clear error messages + generation command |
| L3: CSP headers | LOW | Full CSP + X-Frame-Options + nosniff via middleware |
| API routes missing auth (agents, depts, chat, users, company) | HIGH | Added `getSessionUser()` + role checks |
| Bridge CORS open to all origins | HIGH | Restricted to `APP_URL` |
| PostgreSQL port exposed to 0.0.0.0 | HIGH | Bound to 127.0.0.1 |
| pgAdmin default password "admin" | HIGH | Requires explicit env var |
| .env.example zero-key valid for encryption | MEDIUM | Changed to invalid placeholder |
| SHA-256 password hashing | CRITICAL | Replaced with scrypt (prior session) |
| updateRunStatus no-op | CRITICAL | Fixed SQL UPDATE (prior session) |
| MCP server no auth | CRITICAL | Added BRIDGE_TOKEN check (prior session) |
