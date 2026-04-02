import { NextResponse } from "next/server";
import { getShows } from "@/lib/store";
import { getShowRecommendations, TmdbShow } from "@/lib/tmdb";

export async function GET() {
  const shows = await getShows();
  if (shows.length === 0) return NextResponse.json([]);

  const savedIds = new Set(shows.map((s) => s.id));
  const recMap = new Map<number, { show: TmdbShow; recommendedBy: string[]; count: number }>();

  await Promise.all(
    shows.map(async (s) => {
      const recs = await getShowRecommendations(s.id);
      for (const rec of recs) {
        if (savedIds.has(rec.id)) continue;
        if (!recMap.has(rec.id)) {
          recMap.set(rec.id, { show: rec, recommendedBy: [], count: 0 });
        }
        const entry = recMap.get(rec.id)!;
        entry.recommendedBy.push(s.name);
        entry.count++;
      }
    })
  );

  const sorted = Array.from(recMap.values()).sort((a, b) => b.count - a.count);
  return NextResponse.json(sorted);
}
