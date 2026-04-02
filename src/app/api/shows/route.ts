import { NextRequest, NextResponse } from "next/server";
import { getShows, addShow, StoredShow } from "@/lib/store";
import { getShowDetails, getShowCredits } from "@/lib/tmdb";

export async function GET() {
  const shows = await getShows();
  return NextResponse.json(shows);
}

export async function POST(req: NextRequest) {
  const { showId } = await req.json();
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const [details, cast] = await Promise.all([
    getShowDetails(showId),
    getShowCredits(showId),
  ]);

  const show: StoredShow = {
    id: details.id,
    name: details.name,
    poster_path: details.poster_path,
    first_air_date: details.first_air_date,
    overview: details.overview,
    genres: details.genres?.map((g) => g.name) ?? [],
    vote_average: details.vote_average,
    cast: cast.slice(0, 100).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
    })),
  };

  const saved = await addShow(show);
  return NextResponse.json(saved);
}
