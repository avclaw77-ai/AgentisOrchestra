"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  UserPlus,
  DollarSign,
  Lightbulb,
  Zap,
  Repeat,
} from "lucide-react"
import type { ApprovalRequest, ApprovalComment } from "@/types"

// =============================================================================
// Types
// =============================================================================

interface ApprovalFeedProps {
  approvals: ApprovalRequest[]
  comments: Record<number, ApprovalComment[]>
  onApprove: (id: number, note: string) => void
  onReject: (id: number, note: string) => void
  onRequestRevision: (id: number, note: string) => void
  onComment: (id: number, body: string) => void
}

// =============================================================================
// Helpers
// =============================================================================

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; label: string }
> = {
  agent_hire: {
    icon: <UserPlus size={12} />,
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Agent Hire",
  },
  budget_override: {
    icon: <DollarSign size={12} />,
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Budget Override",
  },
  strategy_proposal: {
    icon: <Lightbulb size={12} />,
    bg: "bg-purple-50",
    text: "text-purple-700",
    label: "Strategy",
  },
  task_escalation: {
    icon: <Zap size={12} />,
    bg: "bg-red-50",
    text: "text-red-600",
    label: "Escalation",
  },
  routine_activation: {
    icon: <Repeat size={12} />,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Routine",
  },
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  revision_requested: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    label: "Revision Requested",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Approved",
  },
  rejected: { bg: "bg-red-50", text: "text-red-600", label: "Rejected" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelled" },
}

function formatTimeAgo(dateStr: string): string {
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
// ApprovalCard
// =============================================================================

function ApprovalCard({
  approval,
  comments,
  onApprove,
  onReject,
  onRequestRevision,
  onComment,
}: {
  approval: ApprovalRequest
  comments: ApprovalComment[]
  onApprove: (id: number, note: string) => void
  onReject: (id: number, note: string) => void
  onRequestRevision: (id: number, note: string) => void
  onComment: (id: number, body: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "revision" | null
  >(null)
  const [note, setNote] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [commentBody, setCommentBody] = useState("")

  const typeConfig = TYPE_CONFIG[approval.type] || {
    icon: <ShieldAlert size={12} />,
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: approval.type,
  }
  const statusConfig = STATUS_STYLES[approval.status] || STATUS_STYLES.pending
  const isPending =
    approval.status === "pending" || approval.status === "revision_requested"

  function handleAction() {
    if (!actionType) return
    if (actionType === "approve") onApprove(approval.id, note)
    if (actionType === "reject") onReject(approval.id, note)
    if (actionType === "revision") onRequestRevision(approval.id, note)
    setActionType(null)
    setNote("")
    setShowActions(false)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              typeConfig.bg
            )}
          >
            <span className={typeConfig.text}>{typeConfig.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  typeConfig.bg,
                  typeConfig.text
                )}
              >
                {typeConfig.label}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  statusConfig.bg,
                  statusConfig.text
                )}
              >
                {statusConfig.label}
              </span>
            </div>
            <h3 className="text-sm font-medium mt-1">{approval.title}</h3>
            {approval.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {approval.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Clock size={12} />
          {formatTimeAgo(approval.createdAt)}
        </div>
      </div>

      {/* Requester info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {approval.requestedByAgentId && (
          <span>Requested by: {approval.requestedByAgentId}</span>
        )}
        {approval.requestedByUserId && (
          <span>Requested by: {approval.requestedByUserId}</span>
        )}
        {approval.decisionNote && (
          <span className="italic">Note: {approval.decisionNote}</span>
        )}
      </div>

      {/* Action buttons for pending items */}
      {isPending && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              setActionType("approve")
              setShowActions(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 size={12} />
            Approve
          </button>
          <button
            onClick={() => {
              setActionType("reject")
              setShowActions(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <XCircle size={12} />
            Reject
          </button>
          <button
            onClick={() => {
              setActionType("revision")
              setShowActions(true)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
          >
            <RotateCcw size={12} />
            Request Revision
          </button>
        </div>
      )}

      {/* Decision note input */}
      {showActions && actionType && (
        <div className="space-y-2 pt-1">
          <textarea
            placeholder={`Add a note for ${actionType === "revision" ? "revision request" : actionType}...`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-inset rounded-lg px-3 py-2 text-sm outline-none resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAction}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                actionType === "approve" &&
                  "bg-emerald-600 text-white hover:bg-emerald-700",
                actionType === "reject" &&
                  "bg-red-600 text-white hover:bg-red-700",
                actionType === "revision" &&
                  "bg-amber-600 text-white hover:bg-amber-700"
              )}
            >
              Confirm{" "}
              {actionType === "revision"
                ? "Revision Request"
                : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </button>
            <button
              onClick={() => {
                setShowActions(false)
                setActionType(null)
                setNote("")
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare size={12} />
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showComments && (
          <div className="mt-2 space-y-2">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-secondary/50 rounded-lg px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {comment.authorAgentId || comment.authorUserId || "System"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentBody.trim()) {
                    onComment(approval.id, commentBody.trim())
                    setCommentBody("")
                  }
                }}
                className="flex-1 bg-inset rounded-lg px-3 py-1.5 text-xs outline-none"
              />
              <button
                onClick={() => {
                  if (commentBody.trim()) {
                    onComment(approval.id, commentBody.trim())
                    setCommentBody("")
                  }
                }}
                disabled={!commentBody.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main component
// =============================================================================

export function ApprovalFeed({
  approvals,
  comments,
  onApprove,
  onReject,
  onRequestRevision,
  onComment,
}: ApprovalFeedProps) {
  const [tab, setTab] = useState<"pending" | "all">("pending")

  const filteredApprovals =
    tab === "pending"
      ? approvals.filter(
          (a) => a.status === "pending" || a.status === "revision_requested"
        )
      : approvals

  const pendingCount = approvals.filter(
    (a) => a.status === "pending" || a.status === "revision_requested"
  ).length

  if (approvals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No approval requests</h3>
        <p className="text-sm text-muted-foreground">
          Approval requests from agents will appear here for your review.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Approvals</h2>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setTab("pending")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === "pending"
                ? "bg-card shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pending{pendingCount > 0 && ` (${pendingCount})`}
          </button>
          <button
            onClick={() => setTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === "all"
                ? "bg-card shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredApprovals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            comments={comments[approval.id] || []}
            onApprove={onApprove}
            onReject={onReject}
            onRequestRevision={onRequestRevision}
            onComment={onComment}
          />
        ))}

        {filteredApprovals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No {tab === "pending" ? "pending " : ""}approvals to show.
          </p>
        )}
      </div>
    </div>
  )
}
