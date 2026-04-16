# Paperclip Parity Analysis

**Last updated**: 2026-04-16

## Scale Comparison

| Metric | Paperclip | AgentisOrchestra | Target | Status |
|--------|-----------|------------------|--------|--------|
| DB tables | 77 | 34 | ~35 | Done |
| API endpoints | 100+ | 38 | ~50 | 76% |
| UI pages/views | 52 | 9 views + wizard | ~20 | Done |
| Components | 180+ | 32 | ~40 | 80% |
| Adapters | 10 built-in | 4 providers + MCP | 4 + plugins | Done |
| Service files | 110+ | 12 | ~20 | 60% |

We don't replicate 77 tables. We replicate the FEATURES that matter, adapted to our department model.

---

## Feature Parity Matrix

### TIER 1: MUST HAVE -- COMPLETE

| Feature | Paperclip | Orchestra Status |
|---------|-----------|-----------------|
| **Web setup wizard** | CLI-only (`pnpm onboard`) | 7-step web wizard with AI analysis -- WE'RE AHEAD |
| **Agent CRUD + hierarchy** | agents, agent_configs, reportsTo | Full CRUD + config versioning + displayName -- DONE |
| **Agent execution engine** | 190KB heartbeat service | HeartbeatEngine with 10s tick, budget pre-check, session persistence -- DONE |
| **Task/issue management** | 14 tables | tasks, comments, labels, task_labels, Kanban UI, atomic checkout -- DONE |
| **Chat/communication** | issue_comments with threading | SSE streaming chat, per-department channels, message persistence -- DONE |
| **Cost tracking** | cost_events + finance_events | cost_events, CLI savings tracking, per-agent/model/department breakdowns -- DONE |
| **Budget enforcement** | budget_policies + budget_incidents | Full cascade (agent->dept->company), warn/hard-stop, approval overrides -- DONE |
| **Activity audit trail** | activity_log with actor tracking | activity_log + decision_log, populated from all agent actions -- DONE |
| **Auth** | BetterAuth, sessions, API keys | scrypt hashing, session cookies, role-based (admin/member/viewer), multi-dept access -- DONE |
| **Multi-model routing** | None (single adapter) | 4 providers, task-type-aware routing, CLI-first economics -- WE'RE AHEAD |
| **Department org model** | None (flat company) | Full department hierarchy with CEO view, department colors -- WE'RE AHEAD |
| **Docker deployment** | Dockerfile + embedded PG | Docker Compose + healthchecks + Caddy + Makefile + prod compose -- WE'RE AHEAD |
| **Multi-user support** | Basic company members | Role-based (admin/member/viewer), multi-department access, team management -- DONE |
| **Agent displayName** | None | Optional friendly names for change management -- WE'RE AHEAD |

### TIER 2: SHOULD HAVE -- COMPLETE

| Feature | Paperclip | Orchestra Status |
|---------|-----------|-----------------|
| **Routines/workflows** | routines with cron/webhook | Multi-step routines, cron/webhook/manual, concurrency policies, natural language cron -- DONE |
| **Goal hierarchy** | goals table | Company->dept goals with tree rendering, agent ownership -- DONE |
| **Approval workflows** | approvals + comments | Full approval lifecycle, threaded comments, status machine -- DONE |
| **Company export/import** | Structured markdown | JSON templates with metadata, industry tags, workshop import -- DONE |
| **Agent runtime state** | agent_runtime_state table | Session persistence, token/cost accumulation, run history -- DONE |
| **Agent wakeup requests** | Queued wakeups | agentWakeupRequests table, coalescing, source tracking -- DONE |
| **Skill versioning** | company_skills | Versioned skill library, multi-source (local/GitHub/URL) -- DONE |
| **Document management** | documents + issue_documents | documents table with revision history -- DONE |
| **Heartbeat config guidance** | None | Token cost estimation, role-aware tips, CLI savings guidance -- WE'RE AHEAD |
| **Workshop import** | None | AgentisLab workshop output -> Orchestra setup payload -- WE'RE AHEAD |

### TIER 3: IN PROGRESS / PLANNED

| Feature | Paperclip | Orchestra Status |
|---------|-----------|-----------------|
| **System integrations** | None built-in | Connector Agents + MCP hybrid -- PHASE 1 APPROVED |
| **Plugin system** | Full SDK, worker isolation | Worker thread isolation, crash recovery -- DONE (basic) |
| **MCP server** | 40+ tools | 21 tools, JSON-RPC 2.0 -- DONE |
| **Git worktree isolation** | execution_workspaces | Not planned -- agents use CLI/API, not git directly |
| **Feedback/voting** | feedback service | Not planned -- not needed for B2B consulting model |
| **Issue relations (blocking)** | issue_relations | Not planned -- routines handle dependencies |
| **Full financial events** | 12+ event kinds | cost_events covers our needs |

---

## What We Have That Paperclip Doesn't

| Feature | Description |
|---------|-------------|
| **Department model** | Organizational hierarchy vs flat company |
| **Multi-model routing** | 4 providers, task-type routing, CLI-first economics |
| **Web setup wizard** | AI-powered analysis proposes your team in 30 seconds |
| **Multi-user roles** | Admin/member/viewer with department-scoped access |
| **Heartbeat config guidance** | Token cost estimation, helps users not overspend |
| **Workshop import** | Bridge from consulting engagement to platform |
| **Bilingual** | English + Quebec French natively |
| **Agent display names** | Change management -- employees engage with named agents |
| **Budget cascade with guidance** | Not just enforcement -- proactive cost guidance |
| **Connector agents** (Phase 1) | Plug into client systems without custom code |

---

## Security Posture

| Area | Status |
|------|--------|
| Password hashing | scrypt (N=16384, r=8, p=1) |
| API key encryption | AES-256-GCM |
| Session auth | httpOnly cookies, token hashing |
| API auth guards | getSessionUser() on critical routes |
| Role enforcement | Admin-only for user/company mutation |
| Bridge auth | BRIDGE_TOKEN on all routes |
| MCP auth | BRIDGE_TOKEN check |
| CORS | Restricted to APP_URL origin |
| Docker | DB bound to loopback, no default passwords |
| Remaining items | See `design/SECURITY_BACKLOG.md` |
