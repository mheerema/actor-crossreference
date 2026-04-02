import { NextRequest, NextResponse } from "next/server";
import { getCrossReferences } from "@/lib/store";

export async function GET(req: NextRequest) {
  const minStr = req.nextUrl.searchParams.get("min");
  const min = minStr ? parseInt(minStr, 10) : 2;
  const refs = await getCrossReferences(min);
  return NextResponse.json(refs);
}
