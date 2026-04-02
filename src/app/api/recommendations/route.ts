import { NextResponse } from "next/server";
import { getShows } from "@/lib/store";
import { getShowRecommendations, TmdbShow } from "@/lib/tmdb";
import { getRelatedShows, isTraktConfigured } from "@/lib/trakt";
import { searchShows } from "@/lib/tmdb";

export async function GET() {
  try {
    const shows = await getShows();
    if (shows.length === 0) return NextResponse.json([]);

    const savedIds = new Set(shows.map((s) => s.id));
    const recMap = new Map<number, { show: TmdbShow; recommendedBy: string[]; count: number }>();

    const addRec = (show: TmdbShow, sourceName: string) => {
      if (savedIds.has(show.id)) return;
      if (!recMap.has(show.id)) {
        recMap.set(show.id, { show, recommendedBy: [], count: 0 });
      }
      const entry = recMap.get(show.id)!;
      if (!entry.recommendedBy.includes(sourceName)) {
        entry.recommendedBy.push(sourceName);
        entry.count++;
      }
    };

    // Fetch TMDB recommendations for all shows in parallel
    await Promise.all(
      shows.map(async (s) => {
        try {
          const recs = await getShowRecommendations(s.id);
          for (const rec of recs) addRec(rec, s.name);
        } catch {
          // Skip failed recommendation fetches
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
              // If we already have this show from TMDB, just boost it
              if (recMap.has(rel.tmdbId)) {
                addRec(recMap.get(rel.tmdbId)!.show, `${s.name} (Trakt)`);
                continue;
              }
              // Look up the show on TMDB to get full metadata
              try {
                const results = await searchShows(rel.title);
                const match = results.find((r) => r.id === rel.tmdbId);
                if (match) {
                  addRec(match, `${s.name} (Trakt)`);
                }
              } catch {
                // Skip if TMDB lookup fails
              }
            }
          } catch {
            // Skip failed Trakt fetches
          }
        })
      );
    }

    const sorted = Array.from(recMap.values()).sort((a, b) => b.count - a.count);
    return NextResponse.json(sorted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
