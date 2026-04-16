# System Integration Design Brief

**Status**: Recommendation (awaiting CEO approval before build)
**Date**: 2026-04-16
**Author**: CIO

---

## The Problem

Every client has existing systems: ERP, CRM, ticketing, file storage, databases, internal APIs. Orchestra must connect to these without building a custom fork for each client.

Three approaches were evaluated:

---

## Option A: System Connector Agents (Recommended)

Dedicated agents whose sole job is bridging Orchestra to a specific external system.

**How it works:**
- A "Connector Agent" is a regular Orchestra agent with a specialized persona and skills
- Each connector has pre-built skills: `read-crm-contacts`, `create-erp-order`, `query-database`, etc.
- Department agents call connector agents via routines or direct delegation
- Connectors handle auth, rate limiting, retries, and data mapping
- Client configures connection details (API URL, credentials) in the agent's config -- encrypted in DB like provider keys

**Example:**
```
Finance Dept
  ├── Budget Analyst (agent)
  ├── Forecaster (agent)
  └── SAP Connector (system agent)
        Skills: read-gl-accounts, post-journal-entry, get-cost-centers
        Config: { sapUrl: "...", sapUser: "...", sapApiKey: "[encrypted]" }
```

**Pros:**
- Zero custom code per client -- just configuration
- Connector agents are portable (export/import via company templates)
- AgentisLab can build a library of pre-made connectors
- Clients see connectors in the org chart -- transparent, auditable
- Workshop output maps directly: "What systems does this department use?" -> connector agents

**Cons:**
- Each connector is an agent consuming a slot in the roster
- Complex integrations may need multiple skills per connector
- Agent-to-agent communication adds latency vs direct API calls

---

## Option B: MCP Tool Servers

Use the existing MCP (Model Context Protocol) infrastructure to expose external systems as tools.

**How it works:**
- Each integration is an MCP server (separate process) exposing tools
- Agents call tools directly: `mcp.salesforce.get_contact({ id: "..." })`
- MCP servers run as Docker sidecar containers
- Already have MCP infrastructure (port 3848, JSON-RPC 2.0)

**Pros:**
- Lower latency (direct tool call, no agent-to-agent hop)
- Industry standard (MCP is gaining adoption)
- Clean separation of concerns

**Cons:**
- Requires writing/deploying a separate MCP server per integration
- MCP servers are code, not configuration -- harder for non-dev clients
- Less visible in the UI (tools don't show in org chart)
- More Docker containers to manage

---

## Option C: Backend Integration Layer

A dedicated API gateway / middleware that all agents route through.

**How it works:**
- Central integration service with adapters for each system
- Agents make generic calls: `integration.query("erp", "get-orders", { ... })`
- Gateway handles routing, auth, transformation

**Pros:**
- Centralized management
- Single point for monitoring/logging

**Cons:**
- Adds architectural complexity (another service)
- Becomes a bottleneck and SPOF
- Over-engineered for the current scale

---

## Recommendation: Hybrid A + B

**Primary path: Connector Agents (Option A)** for most integrations. This fits Orchestra's agent-first model, is visible in the UI, and can be configured without code.

**Secondary path: MCP Tools (Option B)** for high-frequency, low-latency integrations where agent-to-agent overhead matters (e.g., database queries that happen 100x per routine run).

### Implementation Plan

**Phase 1 -- Connector Agent Framework** (build now)
1. Add `isSystemAgent` boolean to agents table (visual distinction in roster)
2. Add `connectionConfig` encrypted JSON field to agentConfigs (stores external API creds)
3. Create a "System Connectors" section in the org chart
4. Build 3 starter connector templates:
   - **REST API Connector** -- generic HTTP client (any REST API)
   - **Database Connector** -- PostgreSQL/MySQL read-only queries
   - **File System Connector** -- read/write files from mounted volumes or S3

**Phase 2 -- Connector Library** (post-launch)
5. Pre-built connectors for common systems:
   - Salesforce, HubSpot (CRM)
   - QuickBooks, Sage (Accounting)
   - Jira, Linear (Project management)
   - Slack, Teams (Communication)
   - Google Workspace, Microsoft 365
   - SharePoint, Confluence (Knowledge)
6. "Connector Store" UI in settings (browse, install, configure)

**Phase 3 -- MCP Sidecar Support** (when needed)
7. Docker Compose extension for MCP sidecars
8. Agent config can reference MCP tools in addition to skills
9. Auto-discovery of available MCP tools

### Workshop Integration

The AgentisLab workshop process naturally surfaces integration needs:

- **Extract phase**: "What tools does your team use daily?" -> list of systems
- **Architect phase**: Map each system to a connector agent
- **BuildShip phase**: Configure connectors, test connections, wire into routines

Workshop export format already supports this -- connector agents are just agents with a specialized template.

### Security Model

- Connector credentials stored with AES-256-GCM (same as provider keys)
- Each connector agent has its own credential scope (no shared credentials)
- Audit log tracks all external system calls
- Budget policies apply to connector agents (prevent runaway API costs)
- Admin-only access to configure connection details

---

## Decision Requested

Approve the Hybrid A+B approach and greenlight Phase 1 build (connector agent framework).
