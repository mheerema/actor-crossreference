"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Credit {
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

interface PersonData {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string | null;
  place_of_birth: string | null;
  credits: Credit[];
}

interface MyShow {
  id: number;
  name: string;
}

export default function ActorPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonData | null>(null);
  const [myShows, setMyShows] = useState<MyShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [showFilter, setShowFilter] = useState<"all" | "tv" | "movie">("tv");

  useEffect(() => {
    Promise.all([
      fetch(`/api/tmdb/person/${id}`).then((r) => r.json()),
      fetch("/api/shows").then((r) => r.json()),
    ]).then(([p, s]) => {
      if (p.error) {
        setError(p.error);
      } else {
        setPerson(p);
      }
      if (Array.isArray(s)) setMyShows(s);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load actor details");
      setLoading(false);
    });
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <p className="text-slate-400">{error || "Actor not found"}</p>
          <Link href="/" className="text-amber-400 hover:text-amber-300 mt-4 inline-block">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const myShowIds = new Set(myShows.map((s) => s.id));

  const filteredCredits = person.credits
    .filter((c) => showFilter === "all" || c.media_type === showFilter)
    .sort((a, b) => {
      const aInMy = myShowIds.has(a.id) ? 0 : 1;
      const bInMy = myShowIds.has(b.id) ? 0 : 1;
      if (aInMy !== bInMy) return aInMy - bInMy;
      const aDate = a.first_air_date || a.release_date || "";
      const bDate = b.first_air_date || b.release_date || "";
      return bDate.localeCompare(aDate);
    });

  const tvCount = person.credits.filter((c) => c.media_type === "tv").length;
  const movieCount = person.credits.filter((c) => c.media_type === "movie").length;

  const photoUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="flex-shrink-0">
          <div className="relative w-48 h-64 rounded-lg overflow-hidden bg-slate-800">
            {photoUrl ? (
              <Image src={photoUrl} alt={person.name} fill className="object-cover" sizes="192px" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-6xl">?</div>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{person.name}</h1>
          {person.birthday && (
            <p className="text-slate-400 text-sm mb-1">Born: {person.birthday}</p>
          )}
          {person.place_of_birth && (
            <p className="text-slate-400 text-sm mb-3">{person.place_of_birth}</p>
          )}
          {person.biography && (
            <div>
              <p className={`text-slate-300 text-sm leading-relaxed max-w-2xl ${!bioExpanded ? "line-clamp-6" : ""}`}>
                {person.biography}
              </p>
              {person.biography.length > 400 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-amber-400 hover:text-amber-300 text-sm mt-1 transition-colors"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-white">
            Filmography ({filteredCredits.length})
          </h2>
          <div className="flex gap-1">
            {(["tv", "movie", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setShowFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showFilter === filter
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {filter === "tv" ? `TV (${tvCount})` : filter === "movie" ? `Movies (${movieCount})` : `All (${person.credits.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCredits.map((credit, i) => {
            const inMyShows = myShowIds.has(credit.id);
            const isAdding = adding.has(credit.id);
            const posterUrl = credit.poster_path
              ? `https://image.tmdb.org/t/p/w185${credit.poster_path}`
              : null;
            const year = (credit.first_air_date || credit.release_date || "").split("-")[0];
            const displayName = credit.name || credit.title || "Unknown";

            return (
              <div
                key={`${credit.id}-${credit.media_type}-${i}`}
                className={`rounded-lg overflow-hidden border flex flex-col ${
                  inMyShows
                    ? "border-amber-500 ring-1 ring-amber-500/30"
                    : "border-slate-700"
                } bg-slate-800`}
              >
                {inMyShows ? (
                  <Link href={`/show/${credit.id}`} className="block relative h-36 bg-slate-700 group">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={displayName}
                        fill
                        className="object-cover group-hover:opacity-80 transition-opacity"
                        sizes="185px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        No poster
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-amber-500 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded">
                      In your shows
                    </div>
                  </Link>
                ) : (
                  <div className="relative h-36 bg-slate-700">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="185px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        No poster
                      </div>
                    )}
                    {credit.media_type === "movie" && (
                      <div className="absolute top-1 left-1 bg-slate-600 text-slate-200 text-xs px-1.5 py-0.5 rounded">
                        Film
                      </div>
                    )}
                  </div>
                )}
                <div className="p-2 flex-1 flex flex-col">
                  <p className="text-sm font-medium text-white truncate">
                    {displayName}
                  </p>
                  {credit.character && (
                    <p className="text-xs text-slate-400 truncate">as {credit.character}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {year && <p className="text-xs text-slate-500">{year}</p>}
                    {credit.episode_count != null && credit.episode_count > 0 && (
                      <p className="text-xs text-slate-500">
                        {credit.episode_count} ep{credit.episode_count > 1 && "s"}
                      </p>
                    )}
                  </div>
                  {credit.media_type === "tv" && !inMyShows && (
                    <button
                      onClick={() => handleAdd(credit.id)}
                      disabled={isAdding}
                      className={`mt-auto pt-2 w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        isAdding
                          ? "bg-green-600/20 text-green-400 cursor-default"
                          : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      }`}
                    >
                      {isAdding ? "Adding..." : "+ Add to My Shows"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
