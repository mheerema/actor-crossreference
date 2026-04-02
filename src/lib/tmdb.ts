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
  const queryLower = query.toLowerCase().trim();

  // Fetch first page of TV results + multi-search in parallel
  const [tvPage1, multi] = await Promise.all([
    get<{ results: TmdbShow[]; total_results: number }>("/search/tv", { query, page: "1" }),
    get<{ results: MultiSearchResult[] }>("/search/multi", { query }).catch(() => ({ results: [] })),
  ]);

  const seen = new Set<number>();
  const allShows: TmdbShow[] = [];

  const addShow = (show: { id: number; name?: string; title?: string; poster_path: string | null; first_air_date?: string; overview?: string; vote_average?: number; genre_ids?: number[]; origin_country?: string[] }) => {
    if (seen.has(show.id)) return;
    seen.add(show.id);
    allShows.push({
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

  for (const show of tvPage1.results) addShow(show);
  for (const item of multi.results) {
    if (item.media_type === "tv") addShow(item);
  }

  // Score and rank results by relevance
  const scored = allShows.map((show) => {
    let score = 0;
    const nameLower = show.name.toLowerCase();

    // Exact match gets highest score
    if (nameLower === queryLower) score += 100;
    // Name starts with query
    else if (nameLower.startsWith(queryLower)) score += 50;
    // Name contains query as a whole phrase
    else if (nameLower.includes(queryLower)) score += 30;
    // Query words all appear in the name
    else {
      const queryWords = queryLower.split(/\s+/);
      const matchCount = queryWords.filter((w) => nameLower.includes(w)).length;
      score += (matchCount / queryWords.length) * 20;
    }

    // Boost shows with posters (usually more legitimate/complete entries)
    if (show.poster_path) score += 5;
    // Boost by rating (quality signal)
    score += (show.vote_average ?? 0) * 0.5;
    // Boost English-language shows slightly (for a British mystery app)
    if (show.origin_country?.includes("GB") || show.origin_country?.includes("US")) score += 3;

    return { show, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.show).slice(0, 20);
}

export async function getShowDetails(showId: number) {
  return get<TmdbShow>(`/tv/${showId}`);
}

export async function getShowCredits(showId: number) {
  // Fetch aggregate credits (main + recurring cast) and show details for season count
  const [aggData, details] = await Promise.all([
    get<{ cast: TmdbCastMember[] }>(`/tv/${showId}/aggregate_credits`),
    get<{ number_of_seasons: number }>(`/tv/${showId}`),
  ]);

  const castMap = new Map<number, TmdbCastMember>();
  for (const member of aggData.cast) {
    castMap.set(member.id, member);
  }

  // Fetch per-season credits to capture guest stars not in aggregate_credits
  const seasonCount = details.number_of_seasons || 0;
  if (seasonCount > 0 && seasonCount <= 30) {
    const seasonPromises = Array.from({ length: seasonCount }, (_, i) =>
      get<{
        cast?: TmdbCastMember[];
        guest_stars?: TmdbCastMember[];
      }>(`/tv/${showId}/season/${i + 1}/credits`).catch(() => ({
        cast: [],
        guest_stars: [],
      }))
    );
    const seasons = await Promise.all(seasonPromises);

    for (const season of seasons) {
      // Season-level cast
      for (const member of season.cast ?? []) {
        if (!castMap.has(member.id)) {
          castMap.set(member.id, member);
        }
      }
      // Guest stars — these are the ones most likely to be missed
      for (const guest of season.guest_stars ?? []) {
        if (!castMap.has(guest.id)) {
          castMap.set(guest.id, guest);
        }
      }
    }
  }

  // Sort by order (regulars first, then guests)
  return Array.from(castMap.values()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
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
