import { NextRequest, NextResponse } from "next/server";
import { getDismissed, dismissShow, undismissShow } from "@/lib/store";

export async function GET() {
  try {
    const dismissed = await getDismissed();
    return NextResponse.json(dismissed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dismissed list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { showId, undo } = await req.json();
    if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });
    if (undo) {
      await undismissShow(showId);
    } else {
      await dismissShow(showId);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update dismissed list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
