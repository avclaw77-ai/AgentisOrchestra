"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Webhook,
  Hand,
  Repeat,
  ChevronRight,
  ChevronDown,
  Zap,
  Copy,
  Send,
} from "lucide-react"
import type { Routine, RoutineTrigger, RoutineRun } from "@/types"

// =============================================================================
// Types
// =============================================================================

interface RoutineWithMeta extends Routine {
  triggers?: RoutineTrigger[]
  stepCount?: number
  runCount?: number
}

interface RoutineListProps {
  routines: RoutineWithMeta[]
  onSelect: (id: string) => void
  onCreate: () => void
  onTrigger: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", label: "Paused" },
  archived: { bg: "bg-gray-50", text: "text-gray-400", label: "Archived" },
}

function getTriggerIcon(type: string) {
  switch (type) {
    case "cron":
      return <Clock size={12} />
    case "webhook":
      return <Webhook size={12} />
    default:
      return <Hand size={12} />
  }
}

function getTriggerLabel(trigger: RoutineTrigger) {
  if (trigger.type === "cron") {
    return trigger.cronHumanLabel || trigger.cronExpression || "Schedule"
  }
  if (trigger.type === "webhook") {
    return trigger.webhookPath || "Webhook"
  }
  return "Manual"
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// =============================================================================
// Component
// =============================================================================

export function RoutineList({
  routines,
  onSelect,
  onCreate,
  onTrigger,
  onStatusChange,
  onDelete,
}: RoutineListProps) {
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
  const [expandedRuns, setExpandedRuns] = useState<string | null>(null)
  const [runHistory, setRunHistory] = useState<Record<string, RoutineRun[]>>({})
  const [loadingRuns, setLoadingRuns] = useState<string | null>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  async function toggleRunHistory(routineId: string) {
    if (expandedRuns === routineId) {
      setExpandedRuns(null)
      return
    }
    setExpandedRuns(routineId)
    if (runHistory[routineId]) return
    setLoadingRuns(routineId)
    try {
      const res = await fetch(`/api/routines/${routineId}/runs?limit=10`)
      if (res.ok) {
        const data = await res.json()
        setRunHistory((prev) => ({ ...prev, [routineId]: data }))
      }
    } catch {
      // runs not available yet
    } finally {
      setLoadingRuns(null)
    }
  }
  if (routines.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Repeat size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No routines yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create multi-step agent workflows with scheduling and triggers.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Create Routine
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Routines</h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          New Routine
        </button>
      </div>

      <div className="space-y-2">
        {routines.map((routine) => {
          const status = STATUS_STYLES[routine.status] || STATUS_STYLES.draft
          const trigger = routine.triggers?.[0]

          const webhookTrigger = routine.triggers?.find(t => t.type === "webhook")
          const isWebhookExpanded = expandedWebhook === routine.id

          return (
            <div
              key={routine.id}
              className="bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => onSelect(routine.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Repeat size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate">
                          {routine.name}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                            status.bg,
                            status.text
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {trigger && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getTriggerIcon(trigger.type)}
                            {getTriggerLabel(trigger)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {routine.stepCount || 0} step
                          {(routine.stepCount || 0) !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {routine.runCount || 0} run
                          {(routine.runCount || 0) !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last: {formatTimeAgo(routine.lastTriggeredAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {/* Quick actions */}
                    {routine.status === "active" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusChange(routine.id, "paused")
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Pause"
                      >
                        <Pause size={14} />
                      </button>
                    )}
                    {(routine.status === "draft" || routine.status === "paused") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStatusChange(routine.id, "active")
                        }}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                        title="Activate"
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTrigger(routine.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Trigger Now"
                    >
                      <Zap size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete routine "${routine.name}"?`)) {
                          onDelete(routine.id)
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={14} className="text-muted-foreground ml-1" />
                  </div>
                </div>
              </div>

              {/* Run history section */}
              <div className="border-t border-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleRunHistory(routine.id)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Clock size={12} />
                  <span>Run History</span>
                  {expandedRuns === routine.id ? (
                    <ChevronDown size={12} className="ml-auto" />
                  ) : (
                    <ChevronRight size={12} className="ml-auto" />
                  )}
                </button>
                {expandedRuns === routine.id && (
                  <div className="px-4 pb-3">
                    {loadingRuns === routine.id ? (
                      <p className="text-xs text-muted-foreground py-2">Loading runs...</p>
                    ) : !runHistory[routine.id] || runHistory[routine.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No runs yet</p>
                    ) : (
                      <>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-muted-foreground border-b border-border">
                              <th className="pb-1.5 font-medium">Status</th>
                              <th className="pb-1.5 font-medium">Trigger</th>
                              <th className="pb-1.5 font-medium">Started</th>
                              <th className="pb-1.5 font-medium text-right">Duration</th>
                              <th className="pb-1.5 font-medium text-right">Tokens</th>
                              <th className="pb-1.5 font-medium text-right">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runHistory[routine.id].map((run) => {
                              const statusBadge: Record<string, { bg: string; text: string }> = {
                                completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
                                running: { bg: "bg-amber-50", text: "text-amber-700" },
                                failed: { bg: "bg-red-50", text: "text-red-700" },
                                queued: { bg: "bg-gray-50", text: "text-gray-600" },
                                cancelled: { bg: "bg-gray-50", text: "text-gray-500" },
                                timed_out: { bg: "bg-red-50", text: "text-red-600" },
                              }
                              const badge = statusBadge[run.status] || statusBadge.queued
                              const durationMs = run.startedAt && run.completedAt
                                ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
                                : null
                              const isSelected = expandedRunId === run.id

                              return (
                                <tr
                                  key={run.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedRunId(isSelected ? null : run.id)
                                  }}
                                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                                >
                                  <td className="py-1.5">
                                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", badge.bg, badge.text)}>
                                      {run.status}
                                    </span>
                                  </td>
                                  <td className="py-1.5">
                                    <span className="flex items-center gap-1">
                                      {getTriggerIcon(run.triggerType)}
                                      {run.triggerType}
                                    </span>
                                  </td>
                                  <td className="py-1.5">
                                    {run.startedAt ? formatTimeAgo(run.startedAt) : "-"}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {durationMs != null ? (durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`) : "-"}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {run.totalTokens > 0 ? (run.totalTokens >= 1000 ? `${(run.totalTokens / 1000).toFixed(1)}K` : run.totalTokens) : "-"}
                                  </td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {run.totalCostCents > 0 ? (run.totalCostCents >= 100 ? `$${(run.totalCostCents / 100).toFixed(2)}` : `${run.totalCostCents}c`) : "-"}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {(runHistory[routine.id].length >= 10) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect(routine.id)
                            }}
                            className="text-[10px] text-primary font-medium mt-2 hover:underline"
                          >
                            View all runs
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Webhook test section */}
              {webhookTrigger && (
                <div className="border-t border-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedWebhook(isWebhookExpanded ? null : routine.id)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Webhook size={12} />
                    <span>Test Webhook</span>
                    {isWebhookExpanded ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
                  </button>
                  {isWebhookExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-secondary rounded-lg px-3 py-2 font-mono truncate">
                          {`${window.location.origin}/api/routines/${routine.id}`}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(`${window.location.origin}/api/routines/${routine.id}`)
                            toast.success("URL copied")
                          }}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Copy URL"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const res = await fetch(`/api/routines/${routine.id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                              })
                              if (!res.ok) throw new Error()
                              toast.success("Webhook test sent")
                            } catch {
                              toast.error("Webhook test failed")
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
                        >
                          <Send size={12} />
                          Send Test
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        POST to this URL to trigger the routine externally.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
