import { NextRequest, NextResponse } from "next/server"
import { BRIDGE_URL, BRIDGE_TOKEN } from "@/lib/constants"
import { getSessionUser } from "@/lib/auth"

/** POST /api/agents/[id]/trigger -- manually trigger an agent heartbeat run */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (user.role === "viewer") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })

  const { id } = await params
  let prompt = "Manual trigger -- check for pending tasks and execute."
  try {
    const body = await req.json()
    if (body.prompt) prompt = body.prompt
  } catch {
    // No body is fine -- use default prompt
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/agents/${id}/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {}),
      },
      body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Bridge error: ${res.status} ${text}` }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to trigger agent" },
      { status: 500 }
    )
  }
}
