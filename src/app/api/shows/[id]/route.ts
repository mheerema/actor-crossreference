import { NextRequest, NextResponse } from "next/server";
import { removeShow } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const showId = parseInt(id, 10);
    const removed = await removeShow(showId);
    if (!removed) return NextResponse.json({ error: "Show not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove show";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
