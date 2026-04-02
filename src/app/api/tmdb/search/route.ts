import { NextRequest, NextResponse } from "next/server";
import { searchShows } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  try {
    const results = await searchShows(q);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
