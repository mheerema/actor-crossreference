import { NextRequest, NextResponse } from "next/server";
import { getShowCredits } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cast = await getShowCredits(parseInt(id, 10));
  return NextResponse.json(cast);
}
