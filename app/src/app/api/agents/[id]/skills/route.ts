import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { agentSkills, skills } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// GET /api/agents/[id]/skills -- return skills assigned to this agent
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const rows = await db
    .select({
      id: agentSkills.id,
      agentId: agentSkills.agentId,
      skillId: agentSkills.skillId,
      assignedAt: agentSkills.assignedAt,
      skillKey: skills.key,
      skillName: skills.name,
      skillDescription: skills.description,
      skillCategory: skills.category,
      skillIsActive: skills.isActive,
    })
    .from(agentSkills)
    .innerJoin(skills, eq(agentSkills.skillId, skills.id))
    .where(eq(agentSkills.agentId, id))

  return NextResponse.json(rows)
}

// POST /api/agents/[id]/skills -- assign a skill to this agent
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { skillId } = body

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 })
  }

  // Check if already assigned
  const existing = await db
    .select()
    .from(agentSkills)
    .where(and(eq(agentSkills.agentId, id), eq(agentSkills.skillId, skillId)))

  if (existing.length > 0) {
    return NextResponse.json({ error: "Skill already assigned to this agent" }, { status: 409 })
  }

  const [created] = await db
    .insert(agentSkills)
    .values({ agentId: id, skillId })
    .returning()

  return NextResponse.json(created, { status: 201 })
}

// DELETE /api/agents/[id]/skills -- remove a skill assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { skillId } = body

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 })
  }

  await db
    .delete(agentSkills)
    .where(and(eq(agentSkills.agentId, id), eq(agentSkills.skillId, skillId)))

  return NextResponse.json({ ok: true })
}
