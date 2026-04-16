"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Target,
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Check,
  X,
  Link2,
} from "lucide-react"
import type { Goal, Task, Department } from "@/types"

// =============================================================================
// Types
// =============================================================================

interface GoalTreeProps {
  goals: Goal[]
  tasks: Task[]
  departments: Department[]
  onCreateGoal: (data: {
    title: string
    description: string
    departmentId: string | null
    parentId: string | null
  }) => void
  onUpdateGoal: (
    id: string,
    data: { title?: string; description?: string; status?: string }
  ) => void
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  planned: { bg: "bg-gray-100", text: "text-gray-600", label: "Planned" },
  active: { bg: "bg-blue-50", text: "text-blue-700", label: "Active" },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Completed",
  },
  cancelled: { bg: "bg-red-50", text: "text-red-500", label: "Cancelled" },
}

function buildTree(goals: Goal[]): Goal[] {
  const map = new Map<string, Goal>()
  const roots: Goal[] = []

  for (const g of goals) {
    map.set(g.id, { ...g, children: [] })
  }

  for (const g of goals) {
    const node = map.get(g.id)!
    if (g.parentId && map.has(g.parentId)) {
      map.get(g.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// =============================================================================
// Sub-components
// =============================================================================

function GoalNode({
  goal,
  tasks,
  departments,
  depth,
  onUpdate,
  onAddChild,
}: {
  goal: Goal
  tasks: Task[]
  departments: Department[]
  depth: number
  onUpdate: (
    id: string,
    data: { title?: string; description?: string; status?: string }
  ) => void
  onAddChild: (parentId: string, departmentId: string | null) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(goal.title)

  const linkedTasks = tasks.filter((t) => t.goalId === goal.id)
  const hasChildren =
    (goal.children && goal.children.length > 0) || linkedTasks.length > 0
  const status = STATUS_STYLES[goal.status] || STATUS_STYLES.planned
  const dept = goal.departmentId
    ? departments.find((d) => d.id === goal.departmentId)
    : null

  function handleSaveEdit() {
    if (editTitle.trim() && editTitle !== goal.title) {
      onUpdate(goal.id, { title: editTitle.trim() })
    }
    setEditing(false)
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors group",
          depth === 0 && "bg-card border border-border"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "p-0.5 rounded transition-colors shrink-0",
            hasChildren
              ? "hover:bg-secondary text-muted-foreground"
              : "text-transparent pointer-events-none"
          )}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Icon */}
        <div
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center shrink-0",
            depth === 0 ? "bg-primary/10" : "bg-secondary"
          )}
        >
          <Target
            size={12}
            className={depth === 0 ? "text-primary" : "text-muted-foreground"}
          />
        </div>

        {/* Title */}
        {editing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit()
                if (e.key === "Escape") setEditing(false)
              }}
              className="flex-1 bg-inset rounded px-2 py-1 text-sm outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-1 rounded hover:bg-red-50 text-red-500"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <span
            className={cn(
              "text-sm font-medium truncate flex-1 min-w-0",
              goal.status === "cancelled" && "line-through text-muted-foreground"
            )}
          >
            {goal.title}
          </span>
        )}

        {/* Department badge */}
        {dept && (
          <span
            className="px-1.5 py-0.5 rounded text-xs shrink-0"
            style={{
              backgroundColor: dept.color + "15",
              color: dept.color,
            }}
          >
            {dept.name}
          </span>
        )}

        {/* Status badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
            status.bg,
            status.text
          )}
        >
          {status.label}
        </span>

        {/* Task count */}
        {linkedTasks.length > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
            <Link2 size={10} />
            {linkedTasks.length}
          </span>
        )}

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
              setEditTitle(goal.title)
            }}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddChild(goal.id, goal.departmentId)
            }}
            className="p-1 rounded hover:bg-primary/10 text-primary"
            title="Add sub-goal"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && (
        <>
          {goal.children?.map((child) => (
            <GoalNode
              key={child.id}
              goal={child}
              tasks={tasks}
              departments={departments}
              depth={depth + 1}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
            />
          ))}

          {/* Linked tasks as leaf nodes */}
          {linkedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 py-1.5 px-3 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(depth + 1) * 24 + 12}px` }}
            >
              <div className="w-4 h-4 rounded bg-secondary flex items-center justify-center shrink-0">
                <Link2 size={8} />
              </div>
              <span className="truncate">{task.title}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  task.status === "done"
                    ? "bg-emerald-50 text-emerald-700"
                    : task.status === "in-progress"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                )}
              >
                {task.status}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// =============================================================================
// Inline create form
// =============================================================================

function InlineCreateGoal({
  parentId,
  departmentId,
  departments,
  onSubmit,
  onCancel,
}: {
  parentId: string | null
  departmentId: string | null
  departments: Department[]
  onSubmit: (data: {
    title: string
    description: string
    departmentId: string | null
    parentId: string | null
  }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [deptId, setDeptId] = useState(departmentId)

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
      <input
        type="text"
        placeholder="Goal title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            onSubmit({
              title: title.trim(),
              description: "",
              departmentId: deptId,
              parentId,
            })
          }
          if (e.key === "Escape") onCancel()
        }}
      />
      <div className="flex items-center gap-2">
        <select
          value={deptId || ""}
          onChange={(e) => setDeptId(e.target.value || null)}
          className="bg-inset rounded-lg px-2 py-1.5 text-sm outline-none"
        >
          <option value="">Company-wide</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (title.trim()) {
              onSubmit({
                title: title.trim(),
                description: "",
                departmentId: deptId,
                parentId,
              })
            }
          }}
          disabled={!title.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main component
// =============================================================================

export function GoalTree({
  goals: goalsList,
  tasks,
  departments,
  onCreateGoal,
  onUpdateGoal,
}: GoalTreeProps) {
  const [showCreate, setShowCreate] = useState<{
    parentId: string | null
    departmentId: string | null
  } | null>(null)

  const tree = buildTree(goalsList)

  function handleAddChild(parentId: string, departmentId: string | null) {
    setShowCreate({ parentId, departmentId })
  }

  if (goalsList.length === 0 && !showCreate) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Target size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No goals yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Define your company mission and department goals to align agent work.
        </p>
        <button
          onClick={() => setShowCreate({ parentId: null, departmentId: null })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Add Mission / Goal
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Goals</h2>
        <button
          onClick={() => setShowCreate({ parentId: null, departmentId: null })}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Add Goal
        </button>
      </div>

      <div className="space-y-1">
        {tree.map((goal) => (
          <GoalNode
            key={goal.id}
            goal={goal}
            tasks={tasks}
            departments={departments}
            depth={0}
            onUpdate={onUpdateGoal}
            onAddChild={handleAddChild}
          />
        ))}
      </div>

      {showCreate && (
        <div className="mt-3">
          <InlineCreateGoal
            parentId={showCreate.parentId}
            departmentId={showCreate.departmentId}
            departments={departments}
            onSubmit={(data) => {
              onCreateGoal(data)
              setShowCreate(null)
            }}
            onCancel={() => setShowCreate(null)}
          />
        </div>
      )}
    </div>
  )
}
