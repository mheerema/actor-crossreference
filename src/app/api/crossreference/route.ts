import { NextRequest, NextResponse } from "next/server";
import { getCrossReferences } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const minStr = req.nextUrl.searchParams.get("min");
    const min = minStr ? parseInt(minStr, 10) : 2;
    const refs = await getCrossReferences(min);
    return NextResponse.json(refs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load cross-references";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
