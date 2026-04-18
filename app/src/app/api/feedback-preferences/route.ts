import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { feedbackPreferences } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"

// GET /api/feedback-preferences -- get current user's preferences
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [prefs] = await db
    .select()
    .from(feedbackPreferences)
    .where(eq(feedbackPreferences.userId, user.id))
    .limit(1)

  if (!prefs) {
    // Return defaults
    return NextResponse.json({
      frequency: "light",
      dailyDismissCount: 0,
      weeklyDismissCount: 0,
      lastDailyShown: null,
      lastWeeklyShown: null,
      lastMonthlyShown: null,
    })
  }

  return NextResponse.json(prefs)
}

// PATCH /api/feedback-preferences -- update preferences
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const body = await req.json()

  const validFrequencies = ["active", "light", "off"]
  const updates: Record<string, unknown> = {}

  if (body.frequency !== undefined) {
    if (!validFrequencies.includes(body.frequency)) {
      return NextResponse.json(
        { error: `frequency must be one of: ${validFrequencies.join(", ")}` },
        { status: 400 }
      )
    }
    updates.frequency = body.frequency
  }

  if (body.dailyDismissCount !== undefined) updates.dailyDismissCount = body.dailyDismissCount
  if (body.weeklyDismissCount !== undefined) updates.weeklyDismissCount = body.weeklyDismissCount
  if (body.lastDailyShown !== undefined) updates.lastDailyShown = body.lastDailyShown ? new Date(body.lastDailyShown) : null
  if (body.lastWeeklyShown !== undefined) updates.lastWeeklyShown = body.lastWeeklyShown ? new Date(body.lastWeeklyShown) : null
  if (body.lastMonthlyShown !== undefined) updates.lastMonthlyShown = body.lastMonthlyShown ? new Date(body.lastMonthlyShown) : null

  updates.updatedAt = new Date()

  // Check if record exists
  const [existing] = await db
    .select({ id: feedbackPreferences.id })
    .from(feedbackPreferences)
    .where(eq(feedbackPreferences.userId, user.id))
    .limit(1)

  let result
  if (existing) {
    ;[result] = await db
      .update(feedbackPreferences)
      .set(updates)
      .where(eq(feedbackPreferences.userId, user.id))
      .returning()
  } else {
    ;[result] = await db
      .insert(feedbackPreferences)
      .values({
        userId: user.id,
        ...updates,
      })
      .returning()
  }

  return NextResponse.json(result)
}
