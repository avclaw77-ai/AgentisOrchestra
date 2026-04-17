"use client"

import { useState, useMemo, useCallback } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"
import { TASK_COLUMNS } from "@/lib/constants"
import { Lock, Plus, Circle, Search, GripVertical, Calendar } from "lucide-react"
import type { Task, Agent, TaskStatus } from "@/types"

// ---------------------------------------------------------------------------
// Priority dot colors
// ---------------------------------------------------------------------------
const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-500",
  high: "text-amber-500",
  medium: "text-blue-500",
  low: "text-gray-400",
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const PHASE_LABELS: Record<string, string> = {
  research: "Research",
  spec: "Spec",
  design: "Design",
  build: "Build",
  qa: "QA",
  deploy: "Deploy",
}

// ---------------------------------------------------------------------------
// Task card (draggable)
// ---------------------------------------------------------------------------
function TaskCard({
  task,
  agents,
  onClick,
  index,
}: {
  task: Task
  agents: Agent[]
  onClick: () => void
  index: number
}) {
  const agent = agents.find((a) => a.id === task.assignedTo)

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "w-full rounded-lg border border-border bg-card px-3 py-2 transition-shadow",
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-primary/30"
              : "hover:shadow-sm"
          )}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-1 shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={14} />
            </div>
            <Circle
              size={7}
              className={cn(
                "mt-1.5 shrink-0 fill-current",
                PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium
              )}
            />
            <button
              onClick={onClick}
              className="flex-1 min-w-0 text-left focus:outline-none"
            >
              <p className="text-sm font-medium leading-tight truncate">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {agent && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {agent.displayName || agent.name}
                  </span>
                )}
                {task.phase && (
                  <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                    {PHASE_LABELS[task.phase] || task.phase}
                  </span>
                )}
                {task.dueDate && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-[10px]",
                    new Date(task.dueDate) < new Date() && task.status !== "done"
                      ? "text-red-500 font-medium"
                      : "text-muted-foreground"
                  )}>
                    <Calendar size={10} />
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
                {task.executionLockedAt && (
                  <Lock size={12} className="text-amber-500 shrink-0" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ---------------------------------------------------------------------------
// Kanban column (droppable)
// ---------------------------------------------------------------------------
function KanbanColumn({
  column,
  tasks,
  agents,
  departmentColors,
  isCeoView,
  onSelectTask,
}: {
  column: (typeof TASK_COLUMNS)[number]
  tasks: Task[]
  agents: Agent[]
  departmentColors: Record<string, string>
  isCeoView: boolean
  onSelectTask: (id: string) => void
}) {
  return (
    <div className="bg-secondary/30 rounded-xl border border-border min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          {column.label}{" "}
          <span className="text-muted-foreground font-normal">
            ({tasks.length})
          </span>
        </h3>
      </div>
      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-260px)] transition-colors",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div
                className={cn(
                  "border border-dashed border-border rounded-lg p-6",
                  "flex items-center justify-center text-xs text-muted-foreground"
                )}
              >
                No tasks
              </div>
            ) : (
              tasks.map((task, index) => (
                <div key={task.id} className="relative">
                  {isCeoView && task.departmentId && (
                    <div
                      className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full z-10"
                      style={{
                        backgroundColor:
                          departmentColors[task.departmentId] || "#6b7280",
                      }}
                      title={task.departmentId}
                    />
                  )}
                  <TaskCard
                    task={task}
                    agents={agents}
                    onClick={() => onSelectTask(task.id)}
                    index={index}
                  />
                </div>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KanbanBoard (main export)
// ---------------------------------------------------------------------------
interface KanbanBoardProps {
  tasks: Task[]
  agents: Agent[]
  departmentId: string | null
  departments?: { id: string; name: string; color: string }[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onSelectTask: (taskId: string) => void
  onCreateTask: () => void
}

export function KanbanBoard({
  tasks,
  agents,
  departmentId,
  departments = [],
  onStatusChange,
  onSelectTask,
  onCreateTask,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

  const isCeoView = departmentId === null
  const departmentColors = Object.fromEntries(
    departments.map((d) => [d.id, d.color])
  )

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q))
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    if (assigneeFilter !== "all") {
      result = result.filter((t) => t.assignedTo === assigneeFilter)
    }

    return result
  }, [tasks, searchQuery, priorityFilter, assigneeFilter])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result
      if (!destination) return

      const newStatus = destination.droppableId as TaskStatus
      const task = tasks.find((t) => t.id === draggableId)
      if (!task || task.status === newStatus) return

      onStatusChange(draggableId, newStatus)
    },
    [tasks, onStatusChange]
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Task Board</h2>
        <button
          onClick={onCreateTask}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          )}
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-inset rounded-lg pl-9 pr-3 py-2 text-sm outline-none border border-border focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-inset rounded-lg px-3 py-2 text-sm outline-none border border-border"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="bg-inset rounded-lg px-3 py-2 text-sm outline-none border border-border"
        >
          <option value="all">All Assignees</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.displayName || agent.name}
            </option>
          ))}
        </select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {TASK_COLUMNS.map((col) => {
            const colTasks = filteredTasks
              .filter((t) => t.status === col.key)
              .sort(
                (a, b) =>
                  (PRIORITY_ORDER[a.priority] ?? 2) -
                  (PRIORITY_ORDER[b.priority] ?? 2)
              )
            return (
              <KanbanColumn
                key={col.key}
                column={col}
                tasks={colTasks}
                agents={agents}
                departmentColors={departmentColors}
                isCeoView={isCeoView}
                onSelectTask={onSelectTask}
              />
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
