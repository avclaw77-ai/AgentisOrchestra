"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedbackThumbsProps {
  agentId: string
  contextType: string
  contextId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedbackThumbs({ agentId, contextType, contextId }: FeedbackThumbsProps) {
  const [selected, setSelected] = useState<"up" | "down" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleClick(direction: "up" | "down") {
    if (selected || submitting) return
    setSubmitting(true)
    const rating = direction === "up" ? 1 : -1
    try {
      await fetch(`/api/agents/${agentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "thumbs",
          rating,
          contextType,
          contextId,
        }),
      })
      setSelected(direction)
    } catch {
      // Silent fail -- non-critical feedback
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleClick("up")}
        disabled={selected !== null || submitting}
        className={cn(
          "p-1 rounded transition-colors",
          selected === "up"
            ? "text-emerald-500"
            : selected !== null
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-muted-foreground/50 hover:text-emerald-500 hover:bg-emerald-50"
        )}
        title="Helpful"
      >
        <ThumbsUp size={14} fill={selected === "up" ? "currentColor" : "none"} />
      </button>
      <button
        onClick={() => handleClick("down")}
        disabled={selected !== null || submitting}
        className={cn(
          "p-1 rounded transition-colors",
          selected === "down"
            ? "text-red-400"
            : selected !== null
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-muted-foreground/50 hover:text-red-400 hover:bg-red-50"
        )}
        title="Not helpful"
      >
        <ThumbsDown size={14} fill={selected === "down" ? "currentColor" : "none"} />
      </button>
    </div>
  )
}
