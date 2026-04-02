const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function url(path: string, params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams({ api_key: API_KEY!, ...params });
  return `${TMDB_BASE}${path}?${searchParams}`;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) throw new Error("TMDB_API_KEY is not set in .env.local");
  const res = await fetch(url(path, params), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDb error ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface TmdbShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average: number;
  origin_country: string[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbPerson {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  place_of_birth: string | null;
  known_for_department: string;
}

export interface TmdbCredit {
  id: number;
  name?: string;
  title?: string;
  media_type: "tv" | "movie";
  character: string;
  poster_path: string | null;
  first_air_date?: string;
  release_date?: string;
  episode_count?: number;
}

interface MultiSearchResult {
  id: number;
  media_type: "tv" | "movie" | "person";
  name?: string;
  title?: string;
  poster_path: string | null;
  first_air_date?: string;
  overview?: string;
  genre_ids?: number[];
  vote_average?: number;
  origin_country?: string[];
  known_for?: {
    id: number;
    media_type: "tv" | "movie";
    name?: string;
    title?: string;
    poster_path: string | null;
    first_air_date?: string;
    overview?: string;
    vote_average?: number;
  }[];
}

export async function searchShows(query: string) {
  // Fetch two pages of TV results in parallel with a multi-search
  const [tvPage1, tvPage2, multi] = await Promise.all([
    get<{ results: TmdbShow[]; total_results: number }>("/search/tv", { query, page: "1" }),
    get<{ results: TmdbShow[] }>("/search/tv", { query, page: "2" }).catch(() => ({ results: [] })),
    get<{ results: MultiSearchResult[] }>("/search/multi", { query }).catch(() => ({ results: [] })),
  ]);

  const seen = new Set<number>();
  const results: TmdbShow[] = [];

  const addShow = (show: { id: number; name?: string; title?: string; poster_path: string | null; first_air_date?: string; overview?: string; vote_average?: number; genre_ids?: number[]; origin_country?: string[] }) => {
    if (seen.has(show.id)) return;
    seen.add(show.id);
    results.push({
      id: show.id,
      name: show.name || show.title || "",
      poster_path: show.poster_path,
      first_air_date: show.first_air_date || "",
      overview: show.overview || "",
      genre_ids: show.genre_ids,
      vote_average: show.vote_average ?? 0,
      origin_country: (show as TmdbShow).origin_country || [],
    });
  };

  // Direct TV search results first (most relevant)
  for (const show of tvPage1.results) addShow(show);
  for (const show of tvPage2.results) addShow(show);

  // Multi-search: only include direct TV results (not person known_for,
  // which returns unrelated shows like talk show appearances)
  for (const item of multi.results) {
    if (item.media_type === "tv") {
      addShow(item);
    }
  }

  return results;
}

export async function getShowDetails(showId: number) {
  return get<TmdbShow>(`/tv/${showId}`);
}

export async function getShowCredits(showId: number) {
  const data = await get<{ cast: TmdbCastMember[] }>(`/tv/${showId}/aggregate_credits`);
  return data.cast;
}

export async function getShowRecommendations(showId: number) {
  const data = await get<{ results: TmdbShow[] }>(`/tv/${showId}/recommendations`);
  return data.results;
}

export async function getSimilarShows(showId: number) {
  const data = await get<{ results: TmdbShow[] }>(`/tv/${showId}/similar`);
  return data.results;
}

export async function getPersonDetails(personId: number) {
  return get<TmdbPerson>(`/person/${personId}`);
}

export async function getPersonCredits(personId: number) {
  const data = await get<{ cast: TmdbCredit[] }>(`/person/${personId}/combined_credits`);
  return data.cast;
}
