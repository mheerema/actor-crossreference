const TVMAZE_BASE = "https://api.tvmaze.com";

interface TvMazeSearchResult {
  score: number;
  person: {
    id: number;
    name: string;
    birthday: string | null;
  };
}

interface TvMazeCastCredit {
  _links: {
    show: { href: string };
    character: { href: string };
  };
  _embedded?: {
    show?: {
      id: number;
      name: string;
      premiered: string | null;
      image: { medium: string; original: string } | null;
      externals: { thetvdb: number | null; imdb: string | null };
    };
    character?: {
      id: number;
      name: string;
    };
  };
}

export interface TvMazeCredit {
  showName: string;
  character: string;
  premiered: string | null;
  posterUrl: string | null;
  tvmazeShowId: number;
}

async function tvmazeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${TVMAZE_BASE}${path}`, {
    next: { revalidate: 86400 }, // Cache for 24h — TVMaze data changes slowly
  });
  if (!res.ok) throw new Error(`TVMaze error ${res.status}`);
  return res.json();
}

export async function searchPerson(name: string): Promise<{ id: number; name: string } | null> {
  try {
    const results = await tvmazeGet<TvMazeSearchResult[]>(
      `/search/people?q=${encodeURIComponent(name)}`
    );
    if (results.length === 0) return null;
    // Return the best match
    return { id: results[0].person.id, name: results[0].person.name };
  } catch {
    return null;
  }
}

export async function getPersonCastCredits(tvmazePersonId: number): Promise<TvMazeCredit[]> {
  try {
    const credits = await tvmazeGet<TvMazeCastCredit[]>(
      `/people/${tvmazePersonId}/castcredits?embed[]=show&embed[]=character`
    );
    return credits
      .filter((c) => c._embedded?.show)
      .map((c) => ({
        showName: c._embedded!.show!.name,
        character: c._embedded?.character?.name ?? "",
        premiered: c._embedded!.show!.premiered,
        posterUrl: c._embedded!.show!.image?.medium ?? null,
        tvmazeShowId: c._embedded!.show!.id,
      }));
  } catch {
    return [];
  }
}

export async function getSupplementalCredits(
  actorName: string,
  existingShowNames: Set<string>
): Promise<TvMazeCredit[]> {
  const person = await searchPerson(actorName);
  if (!person) return [];

  // Verify name match is close enough (case-insensitive)
  if (person.name.toLowerCase() !== actorName.toLowerCase()) return [];

  const credits = await getPersonCastCredits(person.id);

  // Return only credits not already in the TMDB results
  // Match by normalized show name since IDs differ between services
  return credits.filter((c) => {
    const normalized = c.showName.toLowerCase().trim();
    for (const existing of existingShowNames) {
      if (existing.toLowerCase().trim() === normalized) return false;
    }
    return true;
  });
}
