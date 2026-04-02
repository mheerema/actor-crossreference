const OMDB_BASE = "https://www.omdbapi.com";
const API_KEY = process.env.OMDB_API_KEY;

export interface OmdbRatings {
  imdbRating: string | null;
  rottenTomatoes: string | null;
  metacritic: string | null;
}

export interface OmdbShowData {
  title: string;
  year: string;
  rated: string;
  plot: string;
  actors: string;
  genre: string;
  ratings: OmdbRatings;
  imdbID: string;
  poster: string | null;
  totalSeasons: string | null;
}

interface OmdbResponse {
  Response: "True" | "False";
  Error?: string;
  Title?: string;
  Year?: string;
  Rated?: string;
  Plot?: string;
  Actors?: string;
  Genre?: string;
  imdbID?: string;
  Poster?: string;
  totalSeasons?: string;
  Ratings?: { Source: string; Value: string }[];
}

async function omdbGet(params: Record<string, string>): Promise<OmdbResponse> {
  if (!API_KEY) throw new Error("OMDB_API_KEY is not set");
  const searchParams = new URLSearchParams({ apikey: API_KEY, ...params });
  const res = await fetch(`${OMDB_BASE}/?${searchParams}`, {
    next: { revalidate: 86400 }, // Cache 24h
  });
  if (!res.ok) throw new Error(`OMDb error ${res.status}`);
  return res.json();
}

function extractRatings(ratings?: { Source: string; Value: string }[]): OmdbRatings {
  const result: OmdbRatings = { imdbRating: null, rottenTomatoes: null, metacritic: null };
  if (!ratings) return result;
  for (const r of ratings) {
    if (r.Source === "Internet Movie Database") result.imdbRating = r.Value;
    else if (r.Source === "Rotten Tomatoes") result.rottenTomatoes = r.Value;
    else if (r.Source === "Metacritic") result.metacritic = r.Value;
  }
  return result;
}

function parseResponse(data: OmdbResponse): OmdbShowData | null {
  if (data.Response !== "True") return null;
  return {
    title: data.Title || "",
    year: data.Year || "",
    rated: data.Rated || "",
    plot: data.Plot || "",
    actors: data.Actors || "",
    genre: data.Genre || "",
    ratings: extractRatings(data.Ratings),
    imdbID: data.imdbID || "",
    poster: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
    totalSeasons: data.totalSeasons || null,
  };
}

/** Look up a TV series by title */
export async function getShowByTitle(title: string): Promise<OmdbShowData | null> {
  try {
    const data = await omdbGet({ t: title, type: "series" });
    return parseResponse(data);
  } catch {
    return null;
  }
}

/** Look up a show by IMDb ID */
export async function getShowByImdbId(imdbId: string): Promise<OmdbShowData | null> {
  try {
    const data = await omdbGet({ i: imdbId });
    return parseResponse(data);
  } catch {
    return null;
  }
}

/** Check if OMDb is configured */
export function isOmdbConfigured(): boolean {
  return !!API_KEY;
}
