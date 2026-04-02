import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const personId = parseInt(id, 10);
  const [person, credits] = await Promise.all([
    getPersonDetails(personId),
    getPersonCredits(personId),
  ]);
  return NextResponse.json({ ...person, credits });
}
