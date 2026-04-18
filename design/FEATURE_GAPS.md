# Feature Gap Analysis

**Date**: 2026-04-17
**Last updated**: 2026-04-18
**Method**: Competitive comparison vs ChatGPT, Claude.ai, Paperclip, CrewAI + user flow walkthroughs

---

## FIXED (All 33 items closed for v1.0)

| # | Gap | Fix |
|---|-----|-----|
| 1 | No markdown rendering | react-markdown + remark-gfm + prose styling |
| 2 | No stop generating button | AbortController + red stop icon |
| 3 | No multi-conversation per agent | Conversations table, sidebar, CRUD API |
| 4 | No clipboard image paste | Ctrl+V captures images from clipboard |
| 5 | No copy button on responses | Hover-reveal clipboard copy |
| 6 | No edit/retry on chat messages | Inline edit textarea, retry button |
| 7 | No token count per message | SSE done event parsing with usage display |
| 8 | No agent pause/resume | Dashboard hover toggle on heartbeat agents |
| 9 | No live run view | Modal with real-time status polling, token/cost stats |
| 10 | No tool permission config per agent | Checkbox grid in agent profile config |
| 11 | No Kanban drag-and-drop | @hello-pangea/dnd with grip handles + drop zones |
| 12 | No task filter/search | Search input + priority + assignee dropdowns |
| 13 | No task due dates | DB schema + create dialog + kanban cards + detail |
| 14 | No task file attachments | taskAttachments table, upload/list API, detail UI |
| 15 | No task dependencies | blocking/blocked-by badges, add/remove, API |
| 16 | No notification badge | Red count badge on Approvals nav |
| 17 | Dashboard polling too slow | Reduced from 30s to 10s |
| 18 | No password change UI | Settings > General + PATCH /api/auth/password |
| 19 | No post-setup API key management | Models > API Keys tab (add/rotate/delete) |
| 20 | No system/bridge logs view | Settings > Logs tab with level/source filters |
| 21 | No global search modal | Cmd+K across agents, tasks, goals, routines, nav |
| 22 | No keyboard shortcuts | Cmd+K, Cmd+1-9, Escape |
| 23 | No onboarding guidance | First-run checklist on dashboard |
| 24 | Image files read as text | Base64 encoding for binary files |
| 25 | No loading skeleton | Dashboard, Kanban, Chat skeleton components |
| -- | No file browser | Files view with browse, preview, upload |
| -- | No file attachments in chat | Paperclip button + inline content |
| -- | No logout button | Sidebar footer sign-out icon |
| -- | No login error messages | Red alert box with specific messages |
| -- | Login redirect loop | Cookie recovery + form hydration fix |
| -- | Session cookie Secure flag on HTTP | SECURE_COOKIES env var |
| -- | Skills definitions empty | 23 skills populated with real definitions |
| -- | No Models Sandbox | Test any model with prompt presets |

## ALSO COMPLETED (polish + security)

| Item | Detail |
|------|--------|
| French i18n | 60+ new translation strings for all sprint features |
| Help tooltips | Title attributes on all form labels (create task, agent config) |
| Auth guards | getSessionUser() on all 25 API routes (58 handlers) |
| Rate limiting | /api/setup/test-provider: 5 req/min per IP |
| CSP headers | Full Content-Security-Policy + X-Frame-Options on all responses |
| Encryption validation | ENCRYPTION_KEY checked on startup with clear error messages |

## REMAINING (deferred to v1.1+)

| # | Gap | Priority | Target |
|---|-----|----------|--------|
| -- | Real-time SSE push (replace polling entirely) | LOW | v1.1 |
| -- | Agent Soul Engine (persona evolution) | HIGH | v1.1 (Layer 1), v1.2 (Layer 2) |

## SECURITY BACKLOG

See `design/SECURITY_BACKLOG.md` -- all MEDIUM items fixed. 2 LOW remaining (L1: dev port binding, L2: session rotation).

## UPCOMING (v1.1)

See `design/SOUL_ENGINE.md` for the Agent Soul Engine design -- guided persona builder, embedded feedback moments, automatic refinement.
