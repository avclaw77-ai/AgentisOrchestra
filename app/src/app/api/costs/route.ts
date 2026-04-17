import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { costEvents, agents, departments, tasks } from "@/db/schema"
import { sql, eq, and, gte, lte, count, sum, countDistinct } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/costs?departmentId=eng&from=2026-04-01&to=2026-04-30
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const departmentId = req.nextUrl.searchParams.get("departmentId")
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")

  // Default to current month
  const now = new Date()
  const monthStart = from || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const monthEnd = to || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  try {
    // Build conditions
    const dateConditions = [
      gte(costEvents.createdAt, new Date(monthStart)),
      lte(costEvents.createdAt, new Date(monthEnd + "T23:59:59")),
    ]
    if (departmentId) {
      dateConditions.push(eq(costEvents.departmentId, departmentId) as any)
    }
    const where = and(...dateConditions)

    // Total spend
    const [totalRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
      })
      .from(costEvents)
      .where(where)

    // CLI vs API split
    const [cliRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
      })
      .from(costEvents)
      .where(and(...dateConditions, eq(costEvents.billingType, "subscription")))

    const totalCents = Number(totalRow?.total ?? 0)
    const cliCents = Number(cliRow?.total ?? 0)
    const apiCents = totalCents - cliCents

    // CLI savings: estimate what CLI usage would have cost at API rates
    // Use a simplified calculation based on token volumes
    const [savingsRow] = await db
      .select({
        inputTokens: sql<number>`COALESCE(SUM(${costEvents.inputTokens}), 0)`,
        outputTokens: sql<number>`COALESCE(SUM(${costEvents.outputTokens}), 0)`,
      })
      .from(costEvents)
      .where(and(...dateConditions, eq(costEvents.billingType, "subscription")))

    // Approximate savings using Sonnet API pricing as baseline
    const cliInputTokens = Number(savingsRow?.inputTokens ?? 0)
    const cliOutputTokens = Number(savingsRow?.outputTokens ?? 0)
    const cliSavings = Math.round(
      (cliInputTokens * 300) / 1_000_000 +
        (cliOutputTokens * 1500) / 1_000_000
    )

    // By agent
    const byAgent = await db
      .select({
        agentId: costEvents.agentId,
        agentName: agents.name,
        cents: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
        runs: sql<number>`COUNT(DISTINCT ${costEvents.runId})`,
      })
      .from(costEvents)
      .leftJoin(agents, eq(costEvents.agentId, agents.id))
      .where(where)
      .groupBy(costEvents.agentId, agents.name)
      .orderBy(sql`SUM(${costEvents.costCents}) DESC`)

    // By model
    const byModel = await db
      .select({
        modelId: costEvents.modelId,
        cents: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
        tokens: sql<number>`COALESCE(SUM(${costEvents.inputTokens} + ${costEvents.outputTokens}), 0)`,
      })
      .from(costEvents)
      .where(where)
      .groupBy(costEvents.modelId)
      .orderBy(sql`SUM(${costEvents.costCents}) DESC`)

    // By day
    const byDay = await db
      .select({
        date: sql<string>`to_char(${costEvents.createdAt}, 'YYYY-MM-DD')`,
        cents: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
      })
      .from(costEvents)
      .where(where)
      .groupBy(sql`to_char(${costEvents.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${costEvents.createdAt}, 'YYYY-MM-DD')`)

    // By department
    const byDepartment = await db
      .select({
        departmentId: costEvents.departmentId,
        name: departments.name,
        cents: sql<number>`COALESCE(SUM(${costEvents.costCents}), 0)`,
      })
      .from(costEvents)
      .leftJoin(departments, eq(costEvents.departmentId, departments.id))
      .where(where)
      .groupBy(costEvents.departmentId, departments.name)
      .orderBy(sql`SUM(${costEvents.costCents}) DESC`)

    // Tasks completed this month
    const [taskRow] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, "done"),
          gte(tasks.updatedAt, new Date(monthStart))
        )
      )

    // Total runs
    const [runRow] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${costEvents.runId})`,
      })
      .from(costEvents)
      .where(where)

    return NextResponse.json({
      totalCents,
      cliCents,
      apiCents,
      cliSavings,
      byAgent: byAgent.map((r) => ({
        agentId: r.agentId,
        agentName: r.agentName ?? r.agentId,
        cents: Number(r.cents),
        runs: Number(r.runs),
      })),
      byModel: byModel.map((r) => ({
        modelId: r.modelId,
        cents: Number(r.cents),
        tokens: Number(r.tokens),
      })),
      byDay: byDay.map((r) => ({
        date: r.date,
        cents: Number(r.cents),
      })),
      byDepartment: byDepartment
        .filter((r) => r.departmentId)
        .map((r) => ({
          departmentId: r.departmentId!,
          name: r.name ?? r.departmentId!,
          cents: Number(r.cents),
        })),
      tasksCompleted: Number(taskRow?.count ?? 0),
      totalRuns: Number(runRow?.count ?? 0),
    })
  } catch (err) {
    console.error("[api/costs] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch cost data" },
      { status: 500 }
    )
  }
}
