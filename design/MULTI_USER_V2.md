# Multi-User Model v2 -- Flexible, Not Rigid

## CEO Feedback on v1

The v1 design was too restrictive:
- Same person may head multiple departments during pilot phase
- CEO needs full action capability everywhere, not just "view all"
- Don't force workflows -- let teams find their rhythm
- During initial rollout, 1-2 people may manage all departments

## Revised Principles

1. **Permissions, not restrictions.** Users get access to departments, not locked into one.
2. **Default to open.** A user with access to a department can do everything in it.
3. **CEO is a role, not a view.** Admin users can act on any department, not just observe.
4. **Multi-department users are normal.** Lucy might manage Finance AND Operations during pilot.
5. **The UI adapts to what you have access to.** One department? No selector needed. Multiple? Selector appears. All? CEO mode.

## The Model

```
Users
  ├── Alex (admin) -- all departments, full control
  ├── Lucy (member) -- Finance + Operations (she runs both during pilot)
  ├── Max (member) -- Engineering only
  └── Sarah (viewer) -- Engineering (read-only, learning the system)
```

### User Roles

| Role | Can Do | Sees |
|------|--------|------|
| `admin` | Everything across all departments. Create/delete departments, manage users, change company settings. | All departments, all agents, all data. |
| `member` | Full control within assigned departments. Chat, create tasks, trigger routines, approve, configure agents. | Only assigned departments and company-wide items. |
| `viewer` | Read-only. Can browse tasks, see activity, read chat history. Cannot modify anything. | Only assigned departments. |

### Department Access

- A user can be assigned to **multiple departments**
- Assignment is a simple join: `user_departments(user_id, department_id)`
- `admin` role bypasses department assignment -- sees everything
- Company-wide items (CEO agent, company goals, company costs) are visible to all roles

### What Changes in the UI

**For admin (Alex):**
- Exactly what exists today. Department selector in sidebar, CEO View shows all.
- Can act on anything in any department. No restrictions.

**For multi-department member (Lucy with Finance + Operations):**
- Sidebar shows department selector with ONLY her departments (no CEO View toggle)
- Switches between Finance and Operations freely
- Can chat with agents, create tasks, approve, etc. in both departments
- Cannot see Engineering or Design

**For single-department member (Max with Engineering):**
- No department selector at all -- sidebar just shows "Engineering" with the color dot
- Full control within Engineering
- Cannot see other departments

**For viewer (Sarah):**
- Same scoping as member, but all mutation buttons are hidden/disabled
- Can browse, read chat history, see activity -- cannot change anything
- Good for: training, observation, auditing

## Schema Changes (minimal)

```sql
-- Modify existing users table
ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'member';
-- role: 'admin' | 'member' | 'viewer'

-- New join table
CREATE TABLE user_departments (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id text NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, department_id)
);
```

That's it. 1 column + 1 table.

## UI Changes

### Shell sidebar
- `admin`: show department selector as-is (all departments + CEO View)
- `member` with 2+ departments: show selector with only their departments (no CEO View)
- `member` with 1 department: hide selector, show department name + color statically
- `viewer`: same as member but with a "Read Only" badge

### Middleware
- Check user role on every API request
- `admin`: pass through
- `member`: verify user has access to the requested department_id
- `viewer`: block all POST/PATCH/DELETE, allow GET only

### Settings > Team tab (new)
- List users with role badges
- "Invite User" button: email, role, department checkboxes
- Admin can change roles and department assignments
- Department heads can't manage users (only admin)

## How It Plays Out

### Scenario 1: Pilot phase (2 people)

Alex (CEO/admin) sets up Orchestra. Creates Engineering, Finance, Operations departments.
Assigns himself as admin (sees everything).
Lucy joins as member with Finance + Operations.

- Alex uses CEO View to monitor everything
- Lucy switches between Finance and Operations in the sidebar
- Both can chat with any agent in their scope
- Lucy can't see Engineering (that's for later when Max joins)

### Scenario 2: Scaling up (5 people)

Max joins as member with Engineering.
Sarah joins as viewer with Engineering (she's new, learning).
Tom joins as member with Sales + Marketing (he runs both).

- Max manages Engineering independently
- Sarah watches and learns, reads Max's conversations with agents
- Tom switches between Sales and Marketing
- Alex still sees everything from CEO View
- Lucy still manages Finance + Operations

### Scenario 3: CEO wants to act on Engineering

Alex (admin) selects Engineering in the department selector.
He can: chat with Dev agent, create tasks, trigger routines, approve -- everything.
He's not limited to "viewing" -- admin means full action capability everywhere.

## What We're NOT Building (yet)

- **Granular permissions** (e.g., "can create tasks but not delete"). Roles are enough for now.
- **Department-level roles** (e.g., "admin of Engineering but viewer of Finance"). Too complex.
- **Teams/squads within departments.** Departments are the unit, not sub-teams.
- **Audit trail of who did what.** Activity log already tracks agent actions. User attribution comes later.
- **SSO/SAML.** Enterprise feature for Open Core tier.

## Implementation Priority

1. **Add role column to users** -- 1 migration, no UI change needed yet
2. **Add user_departments table** -- 1 table
3. **Update middleware** -- check role + department access on API calls
4. **Update shell** -- adapt department selector based on user role/departments
5. **Add Settings > Team tab** -- user list, invite, role/department management
6. **Update setup wizard** -- first user is always admin (already the case)

Steps 1-4 are small. Step 5 is medium. Total: a few hours of focused work.

## Questions Resolved

From v1 design brief:
1. ~~Should department heads see OTHER departments?~~ **Yes if assigned. No if not.**
2. ~~Should CEO be notified on escalation?~~ **Yes -- escalation creates a company-wide approval visible to admin.**
3. ~~Should agents adjust to who they're talking to?~~ **Yes -- user_id on chat messages. Future: persona awareness.**
4. ~~How formal should review flow be?~~ **Light. Approve/reject on tasks. No mandatory review gates.**
5. ~~Multiple users per department?~~ **Yes. Multiple members + viewers per department is normal.**
