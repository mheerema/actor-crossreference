"use client";

import { useEffect, useState, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import ShowCard from "@/components/ShowCard";

interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genres?: string[];
  genre_ids?: number[];
  vote_average?: number;
}

type SortKey = "name" | "year" | "rating";

export default function ShowsPage() {
  const [myShows, setMyShows] = useState<Show[]>([]);
  const [searchResults, setSearchResults] = useState<Show[]>([]);
  const [similarShows, setSimilarShows] = useState<Show[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [filterGenre, setFilterGenre] = useState<string>("all");

  useEffect(() => {
    fetch("/api/shows")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMyShows(data);
      });
  }, []);

  const myShowIds = new Set(myShows.map((s) => s.id));

  const handleAdd = async (showId: number) => {
    setAdding((prev) => new Set(prev).add(showId));
    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId }),
      });
      const saved = await res.json();
      if (res.ok) {
        setMyShows((prev) => [...prev, saved]);
      }
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(showId);
        return next;
      });
    }
  };

  const handleRemove = async (showId: number) => {
    await fetch(`/api/shows/${showId}`, { method: "DELETE" });
    setMyShows((prev) => prev.filter((s) => s.id !== showId));
  };

  // Fetch similar shows for the top search result
  const fetchSimilarShows = useCallback(async (results: Show[]) => {
    if (results.length === 0) {
      setSimilarShows([]);
      return;
    }
    setLoadingSimilar(true);
    try {
      // Fetch similar for the top 3 results, deduplicate
      const topIds = results.slice(0, 3).map((r) => r.id);
      const allResultIds = new Set(results.map((r) => r.id));
      const responses = await Promise.all(
        topIds.map((id) =>
          fetch(`/api/tmdb/show/${id}/similar`)
            .then((r) => r.json())
            .then((data) => (Array.isArray(data) ? data : []))
            .catch(() => [])
        )
      );
      const seen = new Set<number>();
      const similar: Show[] = [];
      for (const batch of responses) {
        for (const show of batch) {
          if (!seen.has(show.id) && !allResultIds.has(show.id)) {
            seen.add(show.id);
            similar.push(show);
          }
        }
      }
      setSimilarShows(similar.slice(0, 10));
    } catch {
      setSimilarShows([]);
    } finally {
      setLoadingSimilar(false);
    }
  }, []);

  const handleResults = useCallback((results: unknown[]) => {
    const shows = results as Show[];
    setSearchResults(shows);
    fetchSimilarShows(shows);
  }, [fetchSimilarShows]);

  const handleLoading = useCallback((loading: boolean) => {
    setSearching(loading);
    if (loading) {
      setSimilarShows([]);
    }
  }, []);

  const handleError = useCallback((error: string | null) => {
    setSearchError(error);
  }, []);

  // Collect all unique genres from collection
  const allGenres = Array.from(
    new Set(myShows.flatMap((s) => s.genres ?? []))
  ).sort();

  // Filter and sort collection
  const filteredShows = myShows
    .filter((s) => filterGenre === "all" || (s.genres ?? []).includes(filterGenre))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "year": {
          const aYear = a.first_air_date?.split("-")[0] ?? "0";
          const bYear = b.first_air_date?.split("-")[0] ?? "0";
          return bYear.localeCompare(aYear);
        }
        case "rating":
          return (b.vote_average ?? 0) - (a.vote_average ?? 0);
        default:
          return 0;
      }
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">My Shows</h1>

      <div className="mb-8">
        <SearchBar
          onResults={handleResults}
          onLoading={handleLoading}
          onError={handleError}
          placeholder="Search for a TV show to add..."
        />
      </div>

      {searchError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm">
          {searchError}
        </div>
      )}

      {searching && (
        <div className="text-slate-400 mb-6">Searching...</div>
      )}

      {searchResults.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Search Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults.map((show) => (
              <ShowCard
                key={show.id}
                id={show.id}
                name={show.name}
                poster_path={show.poster_path}
                first_air_date={show.first_air_date}
                overview={show.overview}
                vote_average={show.vote_average}
                onAdd={handleAdd}
                added={myShowIds.has(show.id) || adding.has(show.id)}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {(similarShows.length > 0 || loadingSimilar) && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-1">Similar Shows</h2>
          <p className="text-slate-400 text-sm mb-4">
            Shows similar to your search results
          </p>
          {loadingSimilar ? (
            <div className="text-slate-400 text-sm">Finding similar shows...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarShows.map((show) => (
                <ShowCard
                  key={show.id}
                  id={show.id}
                  name={show.name}
                  poster_path={show.poster_path}
                  first_air_date={show.first_air_date}
                  overview={show.overview}
                  vote_average={show.vote_average}
                  onAdd={handleAdd}
                  added={myShowIds.has(show.id) || adding.has(show.id)}
                  compact
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-white">
            My Collection ({filteredShows.length}{filterGenre !== "all" ? ` of ${myShows.length}` : ""})
          </h2>
          {myShows.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="name">Sort: Name</option>
                <option value="year">Sort: Year</option>
                <option value="rating">Sort: Rating</option>
              </select>
              {allGenres.length > 0 && (
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Genres</option>
                  {allGenres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
        {myShows.length === 0 ? (
          <p className="text-slate-400">
            No shows yet. Search above to start adding shows.
          </p>
        ) : filteredShows.length === 0 ? (
          <p className="text-slate-400">
            No shows match the selected filter.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredShows.map((show) => (
              <ShowCard
                key={show.id}
                id={show.id}
                name={show.name}
                poster_path={show.poster_path}
                first_air_date={show.first_air_date}
                overview={show.overview}
                genres={show.genres}
                vote_average={show.vote_average}
                onRemove={handleRemove}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
