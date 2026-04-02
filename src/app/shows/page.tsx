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

export default function ShowsPage() {
  const [myShows, setMyShows] = useState<Show[]>([]);
  const [searchResults, setSearchResults] = useState<Show[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/shows")
      .then((r) => r.json())
      .then(setMyShows);
  }, []);

  const myShowIds = new Set(myShows.map((s) => s.id));

  const handleAdd = async (showId: number) => {
    setAdding((prev) => new Set(prev).add(showId));
    const res = await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId }),
    });
    const saved = await res.json();
    setMyShows((prev) => [...prev, saved]);
    setAdding((prev) => {
      const next = new Set(prev);
      next.delete(showId);
      return next;
    });
  };

  const handleRemove = async (showId: number) => {
    await fetch(`/api/shows/${showId}`, { method: "DELETE" });
    setMyShows((prev) => prev.filter((s) => s.id !== showId));
  };

  const handleResults = useCallback((results: unknown[]) => {
    setSearchResults(results as Show[]);
  }, []);

  const handleLoading = useCallback((loading: boolean) => {
    setSearching(loading);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">My Shows</h1>

      <div className="mb-8">
        <SearchBar
          onResults={handleResults}
          onLoading={handleLoading}
          placeholder="Search for a TV show to add..."
        />
      </div>

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

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          My Collection ({myShows.length})
        </h2>
        {myShows.length === 0 ? (
          <p className="text-slate-400">
            No shows yet. Search above to start adding shows.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {myShows.map((show) => (
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
