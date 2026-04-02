import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    const [person, credits] = await Promise.all([
      getPersonDetails(personId),
      getPersonCredits(personId),
    ]);
    return NextResponse.json({ ...person, credits });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load person";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
