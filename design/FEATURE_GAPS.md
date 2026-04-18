# Feature Gap Analysis

**Date**: 2026-04-17
**Last updated**: 2026-04-18
**Status**: All gaps closed for v1.0. Soul Engine + Model Governance + Escalation shipped.

---

## FIXED (All items closed)

### v1.0 Sprint (33 feature gaps)
All original competitive gaps closed. See CHANGELOG.md v1.0.0 for full list.

### v1.0+ (Post-release)

| Item | Fix |
|------|-----|
| Soul Engine Layer 1 | Guided Soul Builder (7-step interview, structured personas, versioning) |
| Soul Engine Layer 2 | Feedback thumbs, pulse checks, persona proposals with approval workflow |
| Soul Engine Layer 3 | Autonomous self-evaluation after heartbeat runs |
| Model Governance | Admin selects allowed models, provider dedup, live API fetch |
| Agent Escalation | request_approval + report_blocked MCP tools |
| Session Rotation | 24h sliding window token refresh |
| ConversationId storage | Both user + assistant messages tagged for multi-conversation |
| GPT-5.4 family | Updated from deprecated GPT-4o to current models |
| Subscription tier labels | Claude CLI labeled "SUB" not "FREE" |
| Router respects config | Never overrides manually set agent model |

## REMAINING (v1.1+ backlog)

| Item | Priority | Notes |
|------|----------|-------|
| Refinement Engine automation | HIGH | LLM-powered analysis of feedback signals -> auto-generate proposals (data collection done, automation pending) |
| Email notifications on approvals | MEDIUM | Wire SMTP connector to send email when approval/escalation created |
| Real-time SSE push | LOW | Replace 10s polling with server-sent events |
| Onboarding model selection step | LOW | Dedicated setup wizard step for model governance |

## SECURITY BACKLOG

All items closed. See `design/SECURITY_BACKLOG.md`.
