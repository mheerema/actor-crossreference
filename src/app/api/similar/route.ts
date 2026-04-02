import { NextResponse } from "next/server";
import { getShows } from "@/lib/store";
import { getSimilarShows, TmdbShow, searchShows } from "@/lib/tmdb";
import { getRelatedShows, isTraktConfigured } from "@/lib/trakt";

export async function GET() {
  try {
    const shows = await getShows();
    if (shows.length === 0) return NextResponse.json([]);

    const savedIds = new Set(shows.map((s) => s.id));
    const similarMap = new Map<
      number,
      { show: TmdbShow; similarTo: string[]; score: number }
    >();

    const addSimilar = (show: TmdbShow, sourceName: string, baseScore: number) => {
      if (savedIds.has(show.id)) return;
      if (!similarMap.has(show.id)) {
        similarMap.set(show.id, { show, similarTo: [], score: 0 });
      }
      const entry = similarMap.get(show.id)!;
      if (!entry.similarTo.includes(sourceName)) {
        entry.similarTo.push(sourceName);
        entry.score += baseScore + (show.vote_average ?? 0) / 10;
      }
    };

    // Fetch TMDB similar shows for all collection shows in parallel
    await Promise.all(
      shows.map(async (s) => {
        try {
          const similar = await getSimilarShows(s.id);
          for (const sim of similar) addSimilar(sim, s.name, 1);
        } catch {
          // Skip failed fetches
        }
      })
    );

    // Supplement with Trakt related shows if configured
    if (isTraktConfigured()) {
      await Promise.all(
        shows.map(async (s) => {
          try {
            const related = await getRelatedShows(s.id);
            for (const rel of related) {
              if (!rel.tmdbId || savedIds.has(rel.tmdbId)) continue;
              if (similarMap.has(rel.tmdbId)) {
                // Boost existing entry
                addSimilar(similarMap.get(rel.tmdbId)!.show, `${s.name} (Trakt)`, 1.2);
                continue;
              }
              // Resolve TMDB metadata for new Trakt-only entries
              try {
                const results = await searchShows(rel.title);
                const match = results.find((r) => r.id === rel.tmdbId);
                if (match) {
                  addSimilar(match, `${s.name} (Trakt)`, 1.2);
                }
              } catch {
                // Skip
              }
            }
          } catch {
            // Skip failed Trakt fetches
          }
        })
      );
    }

    const sorted = Array.from(similarMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return NextResponse.json(sorted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load similar shows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
