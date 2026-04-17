import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { budgetPolicies, budgetIncidents, costEvents } from "@/db/schema"
import { eq, and, sql, gte, isNull } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/costs/budget -- all active policies with current spend
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  try {
    const policies = await db.select().from(budgetPolicies).where(eq(budgetPolicies.isActive, true))

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Get current spend for each policy scope
    const enriched = await Promise.all(
      policies.map(async (p) => {
        let usedCents = 0
        if (p.windowKind === "calendar_month") {
          if (p.scopeType === "company") {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
              .where(gte(costEvents.createdAt, monthStart))
            usedCents = Number(row?.total ?? 0)
          } else if (p.scopeType === "department" && p.scopeId) {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
              .where(and(eq(costEvents.departmentId, p.scopeId), gte(costEvents.createdAt, monthStart)))
            usedCents = Number(row?.total ?? 0)
          } else if (p.scopeType === "agent" && p.scopeId) {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
              .where(and(eq(costEvents.agentId, p.scopeId), gte(costEvents.createdAt, monthStart)))
            usedCents = Number(row?.total ?? 0)
          }
        } else {
          // lifetime
          if (p.scopeType === "company") {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
            usedCents = Number(row?.total ?? 0)
          } else if (p.scopeType === "department" && p.scopeId) {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
              .where(eq(costEvents.departmentId, p.scopeId))
            usedCents = Number(row?.total ?? 0)
          } else if (p.scopeType === "agent" && p.scopeId) {
            const [row] = await db
              .select({ total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)` })
              .from(costEvents)
              .where(eq(costEvents.agentId, p.scopeId))
            usedCents = Number(row?.total ?? 0)
          }
        }

        return {
          ...p,
          usedCents,
          percentUsed: p.amountCents > 0 ? Math.round((usedCents / p.amountCents) * 100) : 0,
        }
      })
    )

    // Open incidents
    const incidents = await db
      .select()
      .from(budgetIncidents)
      .where(eq(budgetIncidents.status, "open"))

    return NextResponse.json({ policies: enriched, incidents })
  } catch (err) {
    console.error("[api/costs/budget] GET error:", err)
    return NextResponse.json({ error: "Failed to fetch budget data" }, { status: 500 })
  }
}

// POST /api/costs/budget -- create a new budget policy
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const body = await req.json()
    const { scopeType, scopeId, amountCents, warnPercent, hardStopEnabled, windowKind } = body

    if (!scopeType || !amountCents) {
      return NextResponse.json({ error: "scopeType and amountCents are required" }, { status: 400 })
    }

    const [created] = await db
      .insert(budgetPolicies)
      .values({
        scopeType,
        scopeId: scopeId || null,
        amountCents,
        warnPercent: warnPercent ?? 80,
        hardStopEnabled: hardStopEnabled ?? true,
        windowKind: windowKind ?? "calendar_month",
        isActive: true,
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error("[api/costs/budget] POST error:", err)
    return NextResponse.json({ error: "Failed to create budget policy" }, { status: 500 })
  }
}

// PATCH /api/costs/budget -- update a budget policy
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const body = await req.json()
    const { id, amountCents, warnPercent, hardStopEnabled, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (amountCents !== undefined) updates.amountCents = amountCents
    if (warnPercent !== undefined) updates.warnPercent = warnPercent
    if (hardStopEnabled !== undefined) updates.hardStopEnabled = hardStopEnabled
    if (isActive !== undefined) updates.isActive = isActive

    const [updated] = await db
      .update(budgetPolicies)
      .set(updates)
      .where(eq(budgetPolicies.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[api/costs/budget] PATCH error:", err)
    return NextResponse.json({ error: "Failed to update budget policy" }, { status: 500 })
  }
}
