import { NextRequest, NextResponse } from "next/server";
import { searchShows } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  const results = await searchShows(q);
  return NextResponse.json(results);
}
