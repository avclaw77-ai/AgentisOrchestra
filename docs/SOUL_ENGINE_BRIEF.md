# The Soul Engine -- How AgentisOrchestra Makes AI Agents Learn

## The Problem Nobody Has Solved

Every AI agent platform on the market ships with the same fundamental limitation: **static agent definitions.** You write a system prompt, configure some tools, deploy the agent, and hope it works. When it doesn't -- when the agent is too verbose, misses priorities, or makes the wrong judgment call -- someone has to manually rewrite the prompt. That someone is usually the most technical person in the room.

This doesn't scale. When you're running 10 agents across 4 departments, nobody is going back to tune system prompts. The agents stay mediocre, users lose trust, and the platform gets shelved.

**CrewAI, AutoGen, Paperclip, ChatGPT -- none of them have solved this.** They all treat agent identity as a write-once configuration.

AgentisOrchestra's Soul Engine changes that.

---

## What the Soul Engine Does

The Soul Engine is a 3-layer system that makes agents evolve their own personas through real work, real feedback, and real self-reflection. No prompt engineering required.

### Layer 1: Guided Soul Builder

**The problem:** Non-technical users can't write system prompts. Asking a manufacturing floor manager to write "You are a QA agent that prioritizes defect detection with a professional tone..." is unrealistic.

**The solution:** A 7-step guided interview that builds a structured persona through natural conversation.

| Step | Question | Output |
|------|----------|--------|
| 1 | "What does this agent do day-to-day?" | Role definition |
| 2 | "What are its top priorities?" | Priority list |
| 3 | "What should it never do?" | Guardrails |
| 4 | "How should it communicate?" | Tone + style |
| 5 | "What tools does it need?" | Tool permissions |
| 6 | "Who does it report to?" | Hierarchy |
| 7 | Review & confirm | Versioned persona |

The output isn't a blob of text -- it's a **structured persona** with discrete sections (role, priorities, guardrails, tone, tools, hierarchy). Each section can be individually refined. Every version is stored with a diff and the reason for the change.

**What's built:**
- `soul-builder.tsx` -- 543-line React component with step navigation, type-specific inputs (textarea for role, add/remove lists for priorities and guardrails, preset buttons for tone, checkboxes for tools, dropdown for hierarchy)
- `POST /api/agents/{id}/persona` -- creates versioned persona record, syncs to agent config
- `persona_versions` table -- full history with structured JSONB, change source tracking

### Layer 2: Feedback-Driven Refinement

**The problem:** Users won't proactively give feedback on AI behavior. They won't write "your system prompt should emphasize conciseness." But they will click a thumbs-down button if a response is bad.

**The solution:** Embed feedback moments into the natural workflow, then automatically analyze patterns and propose persona improvements.

#### Feedback collection (3 channels, all optional):

**Micro-feedback (in the moment, 1 click):**
- Thumbs up/down after every chat response -- appears on hover, non-intrusive
- After task completion: "Did the agent do this well?"

**Pulse checks (periodic, 30 seconds):**
- Optional daily card on dashboard: star rating per agent + comment
- Auto-backs off: if dismissed 3 times in a row, stops showing
- Configurable per user: Active / Light / Off

**Automatic signals (zero user effort):**
- Run success/failure rate
- Token efficiency trends
- Escalation frequency
- Task reassignment rate

#### Signal analysis + proposal generation:

When enough signals accumulate, the system identifies patterns:
- "8 negative feedback signals mention 'too verbose' in status updates"
- "Agent X fails 60% of research tasks but succeeds 95% on code review"
- "3 weekly pulse checks rate this agent 2/5 on communication"

These patterns become **persona proposals** -- structured diffs with reasoning, confidence level, evidence count, and source attribution. Proposals go through the existing Approvals workflow: the department head reviews, approves, rejects, or defers. Approved proposals auto-update the persona and create a new version.

**What's built:**
- `feedback-thumbs.tsx` -- inline thumbs up/down on every assistant message in chat
- `pulse-check.tsx` -- dashboard card with per-agent star ratings, auto-backoff on dismissal
- `persona-proposals.tsx` -- diff-style review UI with approve/reject/defer buttons
- `persona-history.tsx` -- timeline view of persona evolution with version diffs
- `POST /api/agents/{id}/feedback` -- stores typed feedback with context references
- `GET/PATCH /api/agents/{id}/proposals` -- full CRUD for proposals with approval workflow
- `agent_feedback` table -- typed feedback with ratings, comments, context links
- `persona_proposals` table -- structured proposals with confidence, evidence, status
- `feedback_preferences` table -- per-user frequency control with dismiss tracking

### Layer 3: Autonomous Self-Evaluation

**The problem:** Even with user feedback, there's information only the agent has -- what was hard about a task, what approach didn't work, what it would do differently next time.

**The solution:** After each autonomous heartbeat run, the agent runs a brief self-evaluation using a lightweight model. Fire-and-forget, non-blocking, zero impact on the main workflow.

The self-evaluation captures:
```json
{
  "whatWorked": "Found 3 bugs in the auth module using grep patterns",
  "whatWasHard": "Could not access deployment logs to verify fixes",
  "wouldChangeTo": "Request log access before starting ops-related reviews",
  "confidenceInResult": 75
}
```

These evaluations feed into the Layer 2 refinement engine. Recurring patterns (like repeatedly struggling with deployment access) generate proposals automatically.

**What's built:**
- `triggerSelfEvaluation()` in `bridge/heartbeat.ts` -- fires after successful non-chat runs
- Uses the cheapest available model (monitoring task type via router)
- Parses JSON response, stores in `agent_self_evaluations` table
- Non-blocking: catch errors silently, never delays the main run
- `GET /api/agents/{id}/self-eval` -- paginated access to evaluation history

### Refinement Engine (the brain of Layer 2)

The refinement engine is the automated analysis system that turns raw feedback signals into actionable persona proposals. It runs on-demand (via the "Refine" button in the Soul tab) or can be scheduled as a routine.

**How it works:**
1. Aggregates 30 days of signals: thumbs up/down counts, negative comments, pulse ratings, self-evaluations, run success/failure rates
2. Builds a structured analysis prompt with the current persona + signal summary
3. Calls the LLM (using the router's best available model for analysis tasks)
4. Parses the structured JSON response into 1-3 persona proposals
5. Saves proposals to the `persona_proposals` table with confidence levels and evidence counts
6. Proposals appear in the Soul tab for human review (approve/reject/defer)

**What's built:**
- `POST /agents/{id}/refine` on bridge -- full aggregation + LLM analysis pipeline
- `POST /api/agents/{id}/refine` app proxy (admin only, 90s timeout)
- "Refine" button in agent profile Soul tab with toast feedback
- Proposals saved with `source: 'refinement_engine'` for audit trail

### Email Notifications (complementary system)

When approvals or escalations are created, the system sends email notifications to the admin. Configured via SMTP environment variables. Silent no-op if not configured -- the system works fine without email.

**What's built:**
- `app/src/lib/mailer.ts` -- nodemailer utility with pre-built templates
- `approvalCreatedEmail()` -- branded HTML template with approval details + "Review in Orchestra" button
- `escalationEmail()` -- amber-themed alert for agent blockers
- Wired into `POST /api/approvals` -- fires after every approval creation
- Non-blocking: errors are logged but never break the approval flow

### Agent Escalation (complementary system)

When an agent hits a genuine roadblock -- needs a decision, lacks permissions, or can't proceed -- it can escalate to the human team:

- `request_approval` MCP tool -- creates an approval request visible in the Approvals queue
- `report_blocked` MCP tool -- signals a blocker on a specific task, creates escalation

This completes the human-agent feedback loop: agents work autonomously, escalate when stuck, receive feedback that improves them, and escalate less over time.

---

## The Hard Rule: Always Optional, Never Annoying

Every feedback touchpoint follows these principles:

1. **Dismissible in one click.** No confirmation dialogs.
2. **Never blocks workflow.** Feedback appears as passive elements, never modals interrupting work.
3. **Auto-backs off.** Dismiss daily pulses 3 times? System stops showing them. Weekly instead. Dismiss weekly? Monthly. Monthly? Stops entirely.
4. **Zero feedback = zero penalty.** The system works fine without any user input. Automatic signals drive refinement even silently.
5. **No notification spam.** Feedback prompts never generate push notifications or emails.
6. **Configurable per user.** Settings: Active / Light / Off. Default: Light.

If anyone describes the feedback system as "annoying," we failed.

---

## Why This Is a Competitive Moat

### For clients:
The longer they use Orchestra, the more valuable their agents become. Agents that started generic ("QA tester, review code for bugs") evolve into specialists ("Review auth module code for SQL injection and XSS, keep reports under 3 sentences, defer research tasks to the RnD agent, always check deployment logs before marking a fix as complete"). **Switching cost increases organically.**

### For non-technical users:
They never touch a system prompt. They answer questions during setup (Layer 1), click thumbs up/down during work (Layer 2), and optionally rate their agents weekly. The system handles the rest. **No AI expertise required.**

### For operations managers:
Every persona change is versioned, approved, and auditable. They can see exactly why an agent's behavior changed, who approved it, and roll back if needed. **Full governance and accountability.**

### For us (AgentisLab):
Every deployment generates persona evolution patterns. When a tone refinement works for one manufacturing client's QA agent, that insight can feed into better templates for the next client. **Network effects across deployments.**

---

## What's Built (Implementation Summary)

| Component | Type | Lines | Status |
|-----------|------|-------|--------|
| Soul Builder | UI (7-step interview) | 543 | Production |
| Feedback Thumbs | UI (inline chat) | 82 | Production |
| Pulse Check | UI (dashboard card) | 202 | Production |
| Persona Proposals | UI (diff review) | 229 | Production |
| Persona History | UI (version timeline) | 239 | Production |
| Feedback API | API (5 routes) | 591 | Production |
| Refinement Engine | Bridge (LLM analysis) | 150 | Production |
| Self-Evaluation Hook | Bridge (heartbeat) | 80 | Production |
| Escalation Tools | MCP (2 tools) | 139 | Production |
| Email Notifications | Mailer (nodemailer) | 130 | Production |
| Database | Schema (5 tables) | ~100 | Production |
| Test Suite | E2E (27 assertions) | 385 | 27/27 green |

**Total: ~2,900 lines of production code, tested on live VPS.**

---

## The Pitch (One Paragraph)

AgentisOrchestra is the only multi-agent platform where agents get better the more they work. The Soul Engine builds agent personas through guided interviews (no prompt engineering), refines them through embedded user feedback and automatic pattern analysis, and evolves them through autonomous self-evaluation after every run. Every change is versioned, approved through a governance workflow, and fully auditable. The result: agents that start generic and become specialists -- without anyone ever writing a system prompt.
