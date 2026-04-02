import { NextResponse } from "next/server";
import { getShows, updateShow, StoredShow } from "@/lib/store";
import { getShowDetails, getShowCredits } from "@/lib/tmdb";

export async function POST() {
  try {
    const shows = await getShows();
    if (shows.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    let synced = 0;
    // Process shows in batches of 3 to avoid rate limits
    for (let i = 0; i < shows.length; i += 3) {
      const batch = shows.slice(i, i + 3);
      await Promise.all(
        batch.map(async (s) => {
          try {
            const [details, cast] = await Promise.all([
              getShowDetails(s.id),
              getShowCredits(s.id),
            ]);
            const updated: StoredShow = {
              id: details.id,
              name: details.name,
              poster_path: details.poster_path,
              first_air_date: details.first_air_date,
              overview: details.overview,
              genres: details.genres?.map((g) => g.name) ?? [],
              vote_average: details.vote_average,
              cast: cast.slice(0, 500).map((c) => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profile_path: c.profile_path,
              })),
            };
            await updateShow(updated);
            synced++;
          } catch {
            // Skip shows that fail to fetch
          }
        })
      );
    }

    return NextResponse.json({ synced, total: shows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
