import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getSessionUser } from "@/lib/auth"
import { verifyPassword, hashPassword } from "@/lib/crypto"

// PATCH /api/auth/password -- change current user's password
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    // Fetch the user's current password hash
    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const valid = await verifyPassword(currentPassword, row.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 })
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword)
    await db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api/auth/password] PATCH error:", err)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
