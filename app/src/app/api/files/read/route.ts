import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { BRIDGE_URL, BRIDGE_TOKEN } from "@/lib/constants"

/**
 * GET /api/files/read?path=/outputs/dev/report.md
 * Read file content or download binary
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const filePath = req.nextUrl.searchParams.get("path")
  if (!filePath) return NextResponse.json({ error: "path required" }, { status: 400 })

  try {
    const res = await fetch(`${BRIDGE_URL}/files/read?path=${encodeURIComponent(filePath)}`, {
      headers: BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {},
    })
    if (!res.ok) {
      return NextResponse.json({ error: `File not found: ${res.status}` }, { status: 404 })
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream"

    // Text files: return as JSON with content
    if (contentType.includes("text") || contentType.includes("json") || contentType.includes("markdown")) {
      const text = await res.text()
      return NextResponse.json({ path: filePath, content: text, contentType })
    }

    // Binary files: proxy through
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filePath.split("/").pop()}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Bridge unreachable" }, { status: 502 })
  }
}
