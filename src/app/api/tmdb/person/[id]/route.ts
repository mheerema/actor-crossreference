import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits } from "@/lib/tmdb";
import { getShows } from "@/lib/store";
import { getSupplementalCredits } from "@/lib/tvmaze";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    const [person, credits, myShows] = await Promise.all([
      getPersonDetails(personId),
      getPersonCredits(personId),
      getShows(),
    ]);

    // Supplement TMDB credits with shows from the user's collection
    // that list this actor in their cast but TMDB didn't return
    const tmdbCreditIds = new Set(
      credits.filter((c) => c.media_type === "tv").map((c) => c.id)
    );

    const collectionSupplemental = [];
    for (const show of myShows) {
      if (tmdbCreditIds.has(show.id)) continue;
      const castMatch = show.cast.find((c) => c.id === personId);
      if (castMatch) {
        collectionSupplemental.push({
          id: show.id,
          name: show.name,
          media_type: "tv" as const,
          character: castMatch.character,
          poster_path: show.poster_path,
          first_air_date: show.first_air_date,
        });
      }
    }

    // Supplement with TVMaze credits (runs in parallel-safe way after TMDB)
    // Collect all known show names to avoid duplicates
    const knownNames = new Set([
      ...credits.filter((c) => c.media_type === "tv").map((c) => c.name || ""),
      ...collectionSupplemental.map((c) => c.name),
    ]);

    let tvmazeCredits: {
      id: number;
      name: string;
      media_type: "tv";
      character: string;
      poster_path: string | null;
      first_air_date: string;
      source: "tvmaze";
    }[] = [];

    try {
      const supplemental = await getSupplementalCredits(person.name, knownNames);
      tvmazeCredits = supplemental.map((c, i) => ({
        id: -(c.tvmazeShowId + i), // Negative IDs to avoid TMDB ID collisions
        name: c.showName,
        media_type: "tv" as const,
        character: c.character,
        poster_path: c.posterUrl, // TVMaze URLs are full URLs, not TMDB paths
        first_air_date: c.premiered || "",
        source: "tvmaze" as const,
      }));
    } catch {
      // TVMaze failure shouldn't break the page
    }

    return NextResponse.json({
      ...person,
      credits: [...credits, ...collectionSupplemental, ...tvmazeCredits],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load person";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
