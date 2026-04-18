"use client"

import { useState } from "react"
import { X, Star, Send, SkipForward, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AGENT_COLORS } from "@/lib/constants"
import type { Agent } from "@/types"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PulseCheckProps {
  agents: Agent[]
  onDismiss: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PulseCheck({ agents, onDismiss }: PulseCheckProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [expandedComment, setExpandedComment] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function setRating(agentId: string, value: number) {
    setRatings((prev) => ({ ...prev, [agentId]: value }))
  }

  function setComment(agentId: string, value: string) {
    setComments((prev) => ({ ...prev, [agentId]: value }))
  }

  async function handleSubmit() {
    const rated = Object.entries(ratings).filter(([, v]) => v > 0)
    if (rated.length === 0) {
      toast.error("Rate at least one agent before submitting")
      return
    }

    setSubmitting(true)
    try {
      await Promise.all(
        rated.map(([agentId, rating]) =>
          fetch(`/api/agents/${agentId}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "pulse_daily",
              rating,
              comment: comments[agentId]?.trim() || null,
            }),
          })
        )
      )
      toast.success(`Feedback submitted for ${rated.length} agent${rated.length > 1 ? "s" : ""}`)
      onDismiss()
    } catch {
      toast.error("Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkip() {
    try {
      await fetch("/api/feedback-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss_daily" }),
      })
    } catch {
      // Non-blocking
    }
    onDismiss()
  }

  const hasRatings = Object.values(ratings).some((v) => v > 0)

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">Pulse Check</h3>
          <p className="text-xs text-muted-foreground">How are your agents performing?</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Agent rows */}
      <div className="divide-y divide-border">
        {agents.map((agent) => (
          <div key={agent.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: AGENT_COLORS[agent.id] || "#6366f1" }}
              >
                {(agent.displayName || agent.name).slice(0, 2).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {agent.displayName || agent.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRating(agent.id, val)}
                    className="p-0.5 transition-colors"
                  >
                    <Star
                      size={16}
                      className={cn(
                        "transition-colors",
                        (ratings[agent.id] || 0) >= val
                          ? "text-amber-400 fill-amber-400"
                          : "text-border hover:text-amber-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Optional comment (toggle) */}
            {ratings[agent.id] && (
              <div className="mt-2 ml-11">
                {expandedComment === agent.id ? (
                  <input
                    type="text"
                    value={comments[agent.id] || ""}
                    onChange={(e) => setComment(agent.id, e.target.value)}
                    placeholder="Optional comment..."
                    className="w-full bg-inset rounded-lg px-3 py-1.5 text-xs outline-none border border-border focus:border-primary transition-colors"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setExpandedComment(agent.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    + Add comment
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-inset">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward size={12} />
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasRatings || submitting}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            hasRatings
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={12} />
              Submit
            </>
          )}
        </button>
      </div>
    </div>
  )
}
