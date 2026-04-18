import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { agents, agentFeedback } from "@/db/schema"
import { eq, desc, and, count } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

const VALID_TYPES = ["thumbs", "task_rating", "pulse_daily", "pulse_weekly", "pulse_monthly"] as const

// GET /api/agents/[id]/feedback -- list feedback (paginated, filter by type)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const url = req.nextUrl
  const type = url.searchParams.get("type")
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)))
  const offset = (page - 1) * limit

  // Validate agent exists
  const [agent] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

  // Build conditions
  const conditions = [eq(agentFeedback.agentId, id)]
  if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    conditions.push(eq(agentFeedback.type, type))
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions)

  const [items, [total]] = await Promise.all([
    db
      .select()
      .from(agentFeedback)
      .where(where)
      .orderBy(desc(agentFeedback.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(agentFeedback)
      .where(where),
  ])

  return NextResponse.json({
    items,
    total: total?.count ?? 0,
    page,
    limit,
  })
}

// POST /api/agents/[id]/feedback -- submit feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Validate agent exists
  const [agent] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

  // Validate required fields
  const { type, rating, comment, contextType, contextId } = body
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    )
  }

  if (rating === undefined || rating === null) {
    return NextResponse.json({ error: "rating is required" }, { status: 400 })
  }

  const [inserted] = await db
    .insert(agentFeedback)
    .values({
      agentId: id,
      type,
      rating,
      comment: comment || null,
      contextType: contextType || null,
      contextId: contextId || null,
      userId: user.id,
    })
    .returning()

  return NextResponse.json(inserted, { status: 201 })
}
