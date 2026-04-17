import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { BRIDGE_URL, BRIDGE_TOKEN } from "@/lib/constants"

/**
 * GET /api/files?path=&agent=&type=
 * List files from the bridge's workspace
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const dirPath = req.nextUrl.searchParams.get("path") || "/"
  const agent = req.nextUrl.searchParams.get("agent") || ""
  const type = req.nextUrl.searchParams.get("type") || "" // filter by extension

  try {
    const res = await fetch(`${BRIDGE_URL}/files?path=${encodeURIComponent(dirPath)}&agent=${agent}&type=${type}`, {
      headers: BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {},
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Bridge error: ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Bridge unreachable" }, { status: 502 })
  }
}

/**
 * POST /api/files -- upload a file
 * Proxies multipart upload to bridge
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const targetPath = formData.get("path") as string || "/uploads"
    const agentId = formData.get("agentId") as string || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Forward to bridge
    const bridgeForm = new FormData()
    bridgeForm.append("file", file)
    bridgeForm.append("path", targetPath)
    bridgeForm.append("agentId", agentId)

    const res = await fetch(`${BRIDGE_URL}/files/upload`, {
      method: "POST",
      headers: BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {},
      body: bridgeForm,
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Upload failed: ${text}` }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    )
  }
}
