import { NextRequest, NextResponse } from "next/server";
import { getShowByTitle, isOmdbConfigured } from "@/lib/omdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  if (!isOmdbConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const { title } = await params;
    const decoded = decodeURIComponent(title);
    const data = await getShowByTitle(decoded);
    if (!data) {
      return NextResponse.json({ configured: true, found: false });
    }
    return NextResponse.json({ configured: true, found: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OMDb lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
