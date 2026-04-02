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

export async function searchShows(query: string) {
  const data = await get<{ results: TmdbShow[] }>("/search/tv", { query });
  return data.results;
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

export async function getPersonDetails(personId: number) {
  return get<TmdbPerson>(`/person/${personId}`);
}

export async function getPersonCredits(personId: number) {
  const data = await get<{ cast: TmdbCredit[] }>(`/person/${personId}/combined_credits`);
  return data.cast;
}
