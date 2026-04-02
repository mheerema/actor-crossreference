import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits } from "@/lib/tmdb";
import { getShows } from "@/lib/store";

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

    const supplemental = [];
    for (const show of myShows) {
      if (tmdbCreditIds.has(show.id)) continue;
      const castMatch = show.cast.find((c) => c.id === personId);
      if (castMatch) {
        supplemental.push({
          id: show.id,
          name: show.name,
          media_type: "tv" as const,
          character: castMatch.character,
          poster_path: show.poster_path,
          first_air_date: show.first_air_date,
        });
      }
    }

    return NextResponse.json({
      ...person,
      credits: [...credits, ...supplemental],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load person";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
