const TRAKT_BASE = "https://api.trakt.tv";
const CLIENT_ID = process.env.TRAKT_CLIENT_ID;

interface TraktShow {
  title: string;
  year: number | null;
  ids: {
    trakt: number;
    slug: string;
    tvdb: number | null;
    imdb: string | null;
    tmdb: number | null;
  };
}

export interface TraktRelatedShow {
  title: string;
  year: number | null;
  tmdbId: number | null;
  imdbId: string | null;
  traktSlug: string;
}

async function traktGet<T>(path: string): Promise<T> {
  if (!CLIENT_ID) throw new Error("TRAKT_CLIENT_ID is not set");
  const res = await fetch(`${TRAKT_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": CLIENT_ID,
    },
    next: { revalidate: 86400 }, // Cache 24h
  });
  if (!res.ok) throw new Error(`Trakt error ${res.status}`);
  return res.json();
}

/** Get related shows for a given TMDB ID */
export async function getRelatedShows(tmdbId: number): Promise<TraktRelatedShow[]> {
  try {
    const shows = await traktGet<TraktShow[]>(`/shows/${tmdbId}/related?extended=full`);
    return shows.map((s) => ({
      title: s.title,
      year: s.year,
      tmdbId: s.ids.tmdb,
      imdbId: s.ids.imdb,
      traktSlug: s.ids.slug,
    }));
  } catch {
    // Trakt uses its own IDs for the path — try with tmdb lookup prefix
    try {
      const shows = await traktGet<TraktShow[]>(
        `/shows/tmdb-${tmdbId}/related`
      );
      return shows.map((s) => ({
        title: s.title,
        year: s.year,
        tmdbId: s.ids.tmdb,
        imdbId: s.ids.imdb,
        traktSlug: s.ids.slug,
      }));
    } catch {
      return [];
    }
  }
}

/** Check if Trakt is configured */
export function isTraktConfigured(): boolean {
  return !!CLIENT_ID;
}
