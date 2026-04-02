import { NextRequest, NextResponse } from "next/server";
import { getSimilarShows } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await getSimilarShows(parseInt(id, 10));
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load similar shows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
