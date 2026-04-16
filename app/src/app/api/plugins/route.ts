import { NextRequest, NextResponse } from "next/server"
import { BRIDGE_URL, BRIDGE_TOKEN } from "@/lib/constants"

// GET /api/plugins -- proxy to bridge GET /plugins
export async function GET() {
  try {
    const res = await fetch(`${BRIDGE_URL}/plugins`, {
      headers: BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {},
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "Bridge returned " + res.status },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Bridge unreachable" },
      { status: 502 }
    )
  }
}

// POST /api/plugins -- proxy restart: body { name: string }
export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BRIDGE_URL}/plugins/${encodeURIComponent(name)}/restart`,
      {
        method: "POST",
        headers: BRIDGE_TOKEN ? { Authorization: `Bearer ${BRIDGE_TOKEN}` } : {},
      }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: "Bridge returned " + res.status },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Bridge unreachable" },
      { status: 502 }
    )
  }
}
