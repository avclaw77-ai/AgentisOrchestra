import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { agents, agentSelfEvaluations } from "@/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/agents/[id]/self-eval -- list self-evaluations
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)))
  const offset = (page - 1) * limit

  // Validate agent exists
  const [agent] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

  const [items, [total]] = await Promise.all([
    db
      .select()
      .from(agentSelfEvaluations)
      .where(eq(agentSelfEvaluations.agentId, id))
      .orderBy(desc(agentSelfEvaluations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(agentSelfEvaluations)
      .where(eq(agentSelfEvaluations.agentId, id)),
  ])

  return NextResponse.json({
    items,
    total: total?.count ?? 0,
    page,
    limit,
  })
}

// POST /api/agents/[id]/self-eval -- submit a self-evaluation
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

  const { runId, whatWorked, whatWasHard, wouldChangeTo, confidenceInResult } = body

  // At least one field should be provided
  if (!whatWorked && !whatWasHard && !wouldChangeTo && confidenceInResult === undefined) {
    return NextResponse.json(
      { error: "At least one evaluation field is required (whatWorked, whatWasHard, wouldChangeTo, or confidenceInResult)" },
      { status: 400 }
    )
  }

  const [inserted] = await db
    .insert(agentSelfEvaluations)
    .values({
      agentId: id,
      runId: runId || null,
      whatWorked: whatWorked || null,
      whatWasHard: whatWasHard || null,
      wouldChangeTo: wouldChangeTo || null,
      confidenceInResult: confidenceInResult ?? null,
    })
    .returning()

  return NextResponse.json(inserted, { status: 201 })
}
