import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { agents, agentConfigs, personaVersions } from "@/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/agents/[id]/persona -- current persona version + history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params

  // Validate agent exists
  const [agent] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1)
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

  const [versions, [total]] = await Promise.all([
    db
      .select()
      .from(personaVersions)
      .where(eq(personaVersions.agentId, id))
      .orderBy(desc(personaVersions.version))
      .limit(50),
    db
      .select({ count: count() })
      .from(personaVersions)
      .where(eq(personaVersions.agentId, id)),
  ])

  const current = versions.length > 0 ? versions[0] : null
  const history = versions.length > 1 ? versions.slice(1) : []

  return NextResponse.json({
    current,
    history,
    totalVersions: total?.count ?? 0,
  })
}

// POST /api/agents/[id]/persona -- save a new persona version
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

  const { personaText, structuredPersona, changeSummary, changeSource } = body

  if (!personaText) {
    return NextResponse.json({ error: "personaText is required" }, { status: 400 })
  }

  const validSources = ["manual", "soul_builder", "refinement_engine", "self_evolution"]
  if (!changeSource || !validSources.includes(changeSource)) {
    return NextResponse.json(
      { error: `changeSource is required. Must be one of: ${validSources.join(", ")}` },
      { status: 400 }
    )
  }

  // Get current max version
  const [latest] = await db
    .select({ version: personaVersions.version })
    .from(personaVersions)
    .where(eq(personaVersions.agentId, id))
    .orderBy(desc(personaVersions.version))
    .limit(1)

  const nextVersion = (latest?.version ?? 0) + 1

  const [inserted] = await db
    .insert(personaVersions)
    .values({
      agentId: id,
      version: nextVersion,
      personaText,
      structuredPersona: structuredPersona || null,
      changeSummary: changeSummary || null,
      changeSource,
      approvedBy: user.id,
    })
    .returning()

  // Sync persona text to agentConfigs
  await db
    .update(agentConfigs)
    .set({ persona: personaText, updatedAt: new Date() })
    .where(eq(agentConfigs.agentId, id))

  return NextResponse.json(inserted, { status: 201 })
}

// PATCH /api/agents/[id]/persona -- update agent persona in agentConfigs (keep in sync)
export async function PATCH(
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

  const { personaText } = body
  if (!personaText) {
    return NextResponse.json({ error: "personaText is required" }, { status: 400 })
  }

  // Update agentConfigs
  await db
    .update(agentConfigs)
    .set({ persona: personaText, updatedAt: new Date() })
    .where(eq(agentConfigs.agentId, id))

  return NextResponse.json({ success: true, agentId: id })
}
