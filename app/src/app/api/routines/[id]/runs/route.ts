import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { routineRuns } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/routines/[id]/runs?limit=50&offset=0
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10)

  const runs = await db
    .select()
    .from(routineRuns)
    .where(eq(routineRuns.routineId, id))
    .orderBy(desc(routineRuns.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json(runs)
}
