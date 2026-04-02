import { NextRequest, NextResponse } from "next/server";
import { getShowCredits } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cast = await getShowCredits(parseInt(id, 10));
    return NextResponse.json(cast);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load credits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
