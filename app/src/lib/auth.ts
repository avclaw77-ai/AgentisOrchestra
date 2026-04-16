import { cookies } from "next/headers"
import { db } from "@/db"
import { users, sessions, userDepartments } from "@/db/schema"
import { eq } from "drizzle-orm"
import { hashToken } from "@/lib/crypto"

const COOKIE_NAME = "ao_session"

export type UserRole = "admin" | "member" | "viewer"

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  departmentIds: string[]
}

/** Validate the current session. Returns user with department access or null. */
export async function getSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const tokenHashed = hashToken(token)

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, tokenHashed))
    .limit(1)

  if (!session || session.expiresAt < new Date()) return null

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) return null

  // Get department access list (admin gets empty = all access)
  let departmentIds: string[] = []
  if (user.role !== "admin") {
    const depts = await db
      .select({ departmentId: userDepartments.departmentId })
      .from(userDepartments)
      .where(eq(userDepartments.userId, user.id))
    departmentIds = depts.map((d) => d.departmentId)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    departmentIds,
  }
}

/** Require auth -- returns user or throws 401. */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getSessionUser()
  if (!user) {
    throw new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return user
}

/** Check if user can access a department. Admin = all. */
export function canAccessDepartment(user: UserProfile, departmentId: string | null): boolean {
  if (user.role === "admin") return true
  if (departmentId === null) return true // company-wide items visible to all
  return user.departmentIds.includes(departmentId)
}

/** Check if user can mutate (not a viewer). */
export function canMutate(user: UserProfile): boolean {
  return user.role !== "viewer"
}

/** Require admin role. */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
  return user
}
