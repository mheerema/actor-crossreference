import { NextResponse } from "next/server";
import { getShows } from "@/lib/store";
import { getSimilarShows, TmdbShow } from "@/lib/tmdb";

export async function GET() {
  try {
    const shows = await getShows();
    if (shows.length === 0) return NextResponse.json([]);

    const savedIds = new Set(shows.map((s) => s.id));
    const similarMap = new Map<
      number,
      { show: TmdbShow; similarTo: string[]; score: number }
    >();

    await Promise.all(
      shows.map(async (s) => {
        try {
          const similar = await getSimilarShows(s.id);
          for (const sim of similar) {
            if (savedIds.has(sim.id)) continue;
            if (!similarMap.has(sim.id)) {
              similarMap.set(sim.id, {
                show: sim,
                similarTo: [],
                score: 0,
              });
            }
            const entry = similarMap.get(sim.id)!;
            entry.similarTo.push(s.name);
            // Weight by vote average so higher-rated similar shows rank higher
            entry.score += 1 + (sim.vote_average ?? 0) / 10;
          }
        } catch {
          // Skip failed fetches for individual shows
        }
      })
    );

    const sorted = Array.from(similarMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return NextResponse.json(sorted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load similar shows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
