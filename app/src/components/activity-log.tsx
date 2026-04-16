"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { AGENT_COLORS } from "@/lib/constants"

// =============================================================================
// Types
// =============================================================================

interface ActivityEntry {
  id: number
  departmentId: string | null
  agent: string
  action: string
  task: string | null
  durationMs: number | null
  metadata: Record<string, unknown>
  createdAt: string
}

type FilterType = "all" | "start" | "complete" | "error"

interface ActivityLogProps {
  departmentId?: string | null
}

// =============================================================================
// Helpers
// =============================================================================

const ACTION_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  start: { bg: "bg-blue-50", text: "text-blue-700", label: "Start" },
  complete: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Complete" },
  cancel: { bg: "bg-amber-50", text: "text-amber-700", label: "Cancel" },
  error: { bg: "bg-red-50", text: "text-red-700", label: "Error" },
  task_created: { bg: "bg-blue-50", text: "text-blue-700", label: "Task Created" },
  task_checkout: { bg: "bg-purple-50", text: "text-purple-700", label: "Checkout" },
  company_imported: { bg: "bg-blue-50", text: "text-blue-700", label: "Import" },
}

const FILTER_ACTIONS: Record<FilterType, string[] | null> = {
  all: null,
  start: ["start", "task_created", "task_checkout"],
  complete: ["complete"],
  error: ["error", "cancel"],
}

function formatRelativeTime(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

// =============================================================================
// Component
// =============================================================================

export function ActivityLog({ departmentId }: ActivityLogProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [loading, setLoading] = useState(true)

  const fetchActivity = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (departmentId) params.set("departmentId", departmentId)
      params.set("limit", "50")
      const res = await fetch(`/api/activity?${params}`)
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch {
      // Will load once DB is ready
    } finally {
      setLoading(false)
    }
  }, [departmentId])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [fetchActivity])

  const filtered =
    filter === "all"
      ? entries
      : entries.filter((e) => {
          const allowed = FILTER_ACTIONS[filter]
          return allowed ? allowed.includes(e.action) : true
        })

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "start", label: "Starts" },
    { key: "complete", label: "Completes" },
    { key: "error", label: "Errors" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading activity...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Activity Log</h3>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-card shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Agent actions will appear here as they work
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {filtered.map((entry) => {
            const badge = ACTION_BADGES[entry.action] || {
              bg: "bg-gray-50",
              text: "text-gray-600",
              label: entry.action,
            }

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
              >
                {/* Timestamp */}
                <span className="text-xs text-muted-foreground font-mono w-16 shrink-0">
                  {formatRelativeTime(entry.createdAt)}
                </span>

                {/* Agent dot + name */}
                <div className="flex items-center gap-1.5 w-24 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: AGENT_COLORS[entry.agent] || "#6366f1" }}
                  />
                  <span className="text-xs font-medium truncate capitalize">{entry.agent}</span>
                </div>

                {/* Action badge */}
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                    badge.bg,
                    badge.text
                  )}
                >
                  {badge.label}
                </span>

                {/* Task label */}
                <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                  {entry.task || ""}
                </span>

                {/* Duration */}
                {entry.durationMs != null && entry.durationMs > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {formatDuration(entry.durationMs)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
