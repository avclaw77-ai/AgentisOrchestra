import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { company } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET /api/company -- return company record
export async function GET() {
  try {
    const [row] = await db.select().from(company)
    if (!row) {
      return NextResponse.json({ error: "no company configured" }, { status: 404 })
    }
    return NextResponse.json(row)
  } catch (err) {
    console.error("[api/company] GET error:", err)
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 })
  }
}

// PATCH /api/company -- update company name, mission, locale
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, mission, locale } = body

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (mission !== undefined) updates.mission = mission
    if (locale !== undefined) updates.locale = locale

    const [updated] = await db
      .update(company)
      .set(updates)
      .where(eq(company.id, "default"))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "no company to update" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[api/company] PATCH error:", err)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
