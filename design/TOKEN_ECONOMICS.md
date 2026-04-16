# Token Economics & Consumption Analysis

**Date**: 2026-04-16
**Priority**: CRITICAL -- directly impacts user experience and cost
**Context**: CEO burned through Max 20x subscription in hours with Paperclip. Must not repeat.

---

## Why Paperclip Burns Tokens

Based on code analysis of `packages/adapters/claude-local/src/server/execute.ts`:

### 1. Session Resume = Full Context Reload
Paperclip uses `--resume <sessionId>` which loads the ENTIRE conversation history into context on every heartbeat. A session that started small grows to 100K+ tokens after a few interactions. Every heartbeat re-sends all of it.

**Cost per heartbeat with session**: ~$0.04-0.15 (just for context loading)
**At every-minute heartbeat x 5 agents**: ~$0.75/min = **$45/hour**

### 2. Bootstrap Prompt + System Prompt + Skills
Every execution includes:
- `promptTemplate` (agent persona)
- `bootstrapPromptTemplate` (first-run instructions)
- `sessionHandoffNote` (context from previous session)
- `--append-system-prompt-file` (instructions file)
- `--add-dir skillsDir` (all registered skills loaded as context)

Skills alone can be 5-20K tokens. Combined with persona + history, a single heartbeat can consume 50-150K input tokens.

### 3. No Idle Detection
Paperclip heartbeats fire on schedule regardless of whether there's work to do. An agent with `0 */1 * * *` (every hour) will consume tokens every hour even if nothing has changed.

### 4. Opus by Default
Many agents default to Opus, which has higher per-token cost even within the same subscription tier. Opus is 15x more expensive than Haiku via API.

---

## How Orchestra Is Different (Current State)

### What We Do Right

1. **No session resume** -- each chat/heartbeat is a fresh call with just the prompt. No accumulated context balloon.
2. **CLI-first** -- Pro/Max subscription means flat cost, not per-token billing. But subscription has rate limits, not infinite tokens.
3. **Budget enforcement** -- cascade limits at agent/department/company level with hard stops.
4. **Model router prefers CLI** -- automatically routes to CLI (subscription) over API (per-token).

### What We Do Wrong (Current Risks)

1. **No `--max-turns` limit** -- an agent could loop through many tool calls, consuming tokens on each turn. Paperclip sets `maxTurnsPerRun`.
2. **No timeout on CLI execution** -- a runaway agent could consume tokens indefinitely.
3. **System prompt sent on every call** -- persona is re-sent each time (small cost but adds up).
4. **Heartbeat interval is 10 seconds** -- the tick loop checks for work every 10s. If agents have frequent cron schedules, they'll fire rapidly.
5. **No token counting from CLI** -- we estimate tokens from text length, not actual usage. The CLI JSON output includes real usage data we should parse.
6. **`--verbose` flag** -- adds overhead. Should only be used when explicitly requested.

---

## Subscription Rate Limits (the real constraint)

Claude Pro/Max subscriptions aren't "unlimited tokens" -- they have rate limits:

| Plan | Messages/Day (approx) | Token Window |
|------|----------------------|--------------|
| Pro ($20/mo) | ~100-150 Opus, ~300 Sonnet | 5-min sliding window |
| Max 5x ($100/mo) | ~500-750 Opus, ~1500 Sonnet | 5-min sliding window |
| Max 20x ($200/mo) | ~2000-3000 Opus, ~6000 Sonnet | 5-min sliding window |

**Each CLI invocation = 1 "message"** regardless of token count.

Paperclip with 5 agents on hourly heartbeats = 120 messages/day minimum. With chat interactions on top, you easily hit 500+ messages/day.

**Your direct usage pattern**: ~20-50 messages/day in Cockpit (one agent, focused work). That's why you rarely hit limits.

---

## Optimization Strategy for Orchestra

### MUST DO (before any client deployment)

#### O1: Add `--max-turns` to CLI calls
Limit how many tool-use rounds an agent can do per invocation.

```typescript
// Default: 3 turns per chat, 5 per heartbeat
args.push("--max-turns", String(maxTurns || 3))
```

**Impact**: Prevents runaway loops. A 10-turn agent costs 10x a 1-turn agent.

#### O2: Add execution timeout
Kill CLI process after N seconds.

```typescript
const timeout = setTimeout(() => proc.kill("SIGTERM"), timeoutMs || 60_000)
```

**Impact**: Prevents infinite execution. 60s default is generous.

#### O3: Parse real token usage from CLI output
The CLI `result` event includes actual usage:
```json
{
  "usage": {
    "input_tokens": 3,
    "output_tokens": 12,
    "cache_read_input_tokens": 16952,
    "cache_creation_input_tokens": 0
  },
  "total_cost_usd": 0.008
}
```

Parse this instead of estimating from text length.

**Impact**: Accurate cost tracking. Users know exactly what they're spending.

#### O4: Use Haiku for routine/heartbeat, Sonnet for chat
Heartbeat tasks (check for work, status updates) don't need Sonnet. Route them to Haiku.

```
Chat -> Sonnet (user expects quality)
Heartbeat/cron -> Haiku (background task, speed matters more)
Manual trigger -> Sonnet (user is watching)
```

**Impact**: Haiku is ~15x cheaper than Opus, 5x cheaper than Sonnet.

#### O5: Smart idle detection
Before running a heartbeat, check if there's actually work to do:
- Any tasks assigned to this agent in `in-progress` or `backlog`?
- Any new wakeup requests?
- Any unread messages?

If nothing pending, skip the invocation entirely.

```typescript
const hasWork = await db.agentHasPendingWork(agentId)
if (!hasWork) {
  await db.finalizeRun(runId, { status: "skipped", error: "No pending work" })
  return
}
```

**Impact**: Eliminates empty heartbeats. A department with no tasks consumes zero tokens.

#### O6: Remove `--verbose` from default
Only add `--verbose` when the user requests detailed output or for debugging.

**Impact**: Reduces output size and processing.

### SHOULD DO (first month)

#### O7: Prompt caching / session management
Use `--resume` selectively -- only for multi-turn chat conversations, not for heartbeats. Chat sessions should expire after 30 minutes of inactivity to prevent context balloon.

#### O8: Rate limit per agent
Beyond budget (dollar amount), add message-count limits:
- Max N messages per agent per hour
- Max N messages per agent per day
- Configurable per agent type (chatty agents vs background agents)

#### O9: Token budget estimation in UI
Before enabling a heartbeat schedule, show estimated daily/monthly token cost:
```
"Every hour" x Sonnet = ~24 messages/day = ~$X.XX/month
```

This already partially exists in `heartbeat-config.tsx` -- needs real numbers.

#### O10: Compact system prompts
Strip unnecessary whitespace, examples, and verbose instructions from agent personas. A 2K-token persona vs a 500-token persona = 4x cost multiplier on every call.

### NICE TO HAVE (quarter 2)

#### O11: Response caching
Cache identical queries for a time window. If the same heartbeat prompt gets the same context, return the cached response.

#### O12: Adaptive scheduling
If an agent's heartbeat returns "nothing to do" 3 times in a row, automatically reduce frequency (e.g., hourly -> every 4 hours). Resume normal frequency when work appears.

#### O13: Token analytics dashboard
Show per-agent, per-day token consumption with trends. Alert when an agent's usage pattern changes significantly.

---

## Recommended Default Configuration

For a typical client setup (1 company, 3-5 departments, 10-15 agents):

| Setting | Value | Rationale |
|---------|-------|-----------|
| Default model | `claude-cli:haiku` | Cheapest, fastest, good enough for most tasks |
| Chat model | `claude-cli:sonnet` | Better quality for user-facing conversations |
| Heartbeat model | `claude-cli:haiku` | Background tasks don't need quality |
| Max turns (chat) | 5 | Prevent runaway conversations |
| Max turns (heartbeat) | 3 | Quick check-and-act cycle |
| Execution timeout | 60s | Kill if stuck |
| Heartbeat schedule | Every 4 hours (0 */4 * * *) | 6 runs/day/agent, not 24 or 1440 |
| Idle detection | ON | Skip heartbeat if no pending work |
| Budget (dept) | $10/month | Alerts before surprise costs |
| Budget (company) | $50/month | Hard stop before runaway |

**Estimated daily consumption** with these defaults:
- 15 agents x 6 heartbeats/day (Haiku) = 90 messages
- 20 chat messages/day (Sonnet) = 20 messages
- **Total: ~110 messages/day** -- well within Max 5x limits

**Contrast with Paperclip defaults**:
- 5 agents x 24 heartbeats/day (Opus + session resume) = 120 messages
- Each with 50-150K context = massive token consumption
- Chat on top = easily 500+ messages/day

---

## Action Items

| # | Item | Priority | Effort |
|---|------|----------|--------|
| O1 | Add --max-turns to CLI calls | CRITICAL | 10 min |
| O2 | Add execution timeout | CRITICAL | 10 min |
| O3 | Parse real token usage from CLI result | HIGH | 30 min |
| O4 | Route heartbeat to Haiku by default | HIGH | 15 min |
| O5 | Smart idle detection (skip empty heartbeats) | HIGH | 1 hour |
| O6 | Remove --verbose from default | HIGH | 5 min |
| O7 | Session management for chat (expire after 30min) | MEDIUM | 2 hours |
| O8 | Rate limit per agent (messages/hour) | MEDIUM | 1 hour |
| O9 | Token estimation in heartbeat config UI | MEDIUM | 1 hour |
| O10 | Compact system prompts guidance | LOW | Documentation |
