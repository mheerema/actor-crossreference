import { NextRequest, NextResponse } from "next/server";
import { getShowDetails } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const details = await getShowDetails(parseInt(id, 10));
    return NextResponse.json(details);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load show details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
