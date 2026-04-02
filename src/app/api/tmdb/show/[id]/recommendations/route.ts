import { NextRequest, NextResponse } from "next/server";
import { getShowRecommendations } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recs = await getShowRecommendations(parseInt(id, 10));
  return NextResponse.json(recs);
}
