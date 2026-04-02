"use client";

import { useEffect, useState } from "react";
import ActorCard from "@/components/ActorCard";
import ShowCard from "@/components/ShowCard";
import Link from "next/link";
import Image from "next/image";

interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average?: number;
}

interface CrossRef {
  actor: { id: number; name: string; profile_path: string | null };
  shows: { showId: number; showName: string; character: string }[];
}

interface SimilarEntry {
  show: Show;
  similarTo: string[];
  score: number;
}

export default function Dashboard() {
  const [shows, setShows] = useState<Show[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [similarShows, setSimilarShows] = useState<SimilarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [adding, setAdding] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/shows").then((r) => r.json()),
      fetch("/api/crossreference").then((r) => r.json()),
    ]).then(([s, c]) => {
      if (Array.isArray(s)) setShows(s);
      if (Array.isArray(c)) setCrossRefs(c);
      setLoading(false);

      // Fetch similar shows once we know there are shows in the collection
      if (Array.isArray(s) && s.length > 0) {
        setLoadingSimilar(true);
        fetch("/api/similar")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setSimilarShows(data);
          })
          .catch(() => {})
          .finally(() => setLoadingSimilar(false));
      }
    }).catch(() => {
      setLoading(false);
    });
  }, []);

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
        setShows((prev) => [...prev, saved]);
        setSimilarShows((prev) => prev.filter((e) => e.show.id !== showId));
      }
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(showId);
        return next;
      });
    }
  };

  const myShowIds = new Set(shows.map((s) => s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">
          Tracking {shows.length} show{shows.length !== 1 && "s"} with{" "}
          {crossRefs.length} actor crossover{crossRefs.length !== 1 && "s"}
        </p>
      </div>

      {shows.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-3">No shows yet</h2>
          <p className="text-slate-400 mb-6">
            Start by adding some British mystery shows to your collection.
          </p>
          <Link
            href="/shows"
            className="inline-block px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Add Your First Show
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">My Shows</h2>
              <Link href="/shows" className="text-amber-400 text-sm hover:text-amber-300">
                Manage &rarr;
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {shows.map((s) => (
                <Link
                  key={s.id}
                  href={`/show/${s.id}`}
                  className="flex-shrink-0 w-28 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  <div className="relative h-40 bg-slate-700">
                    {s.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                        alt={s.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                        {s.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 p-2 truncate">{s.name}</p>
                </Link>
              ))}
            </div>
          </section>

          {crossRefs.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Top Crossover Actors
                </h2>
                <Link href="/network" className="text-amber-400 text-sm hover:text-amber-300">
                  View Network &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {crossRefs.slice(0, 10).map((ref) => (
                  <ActorCard
                    key={ref.actor.id}
                    id={ref.actor.id}
                    name={ref.actor.name}
                    profile_path={ref.actor.profile_path}
                    shows={ref.shows.map((s) => ({
                      showName: s.showName,
                      character: s.character,
                    }))}
                  />
                ))}
              </div>
            </section>
          )}

          {(similarShows.length > 0 || loadingSimilar) && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-white">
                  You May Also Like
                </h2>
                <Link href="/recommendations" className="text-amber-400 text-sm hover:text-amber-300">
                  More recommendations &rarr;
                </Link>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Shows similar to the ones in your collection
              </p>
              {loadingSimilar ? (
                <div className="text-slate-400 text-sm">Finding shows you might like...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {similarShows.slice(0, 10).map((entry) => (
                    <ShowCard
                      key={entry.show.id}
                      id={entry.show.id}
                      name={entry.show.name}
                      poster_path={entry.show.poster_path}
                      first_air_date={entry.show.first_air_date}
                      overview={entry.show.overview}
                      vote_average={entry.show.vote_average}
                      onAdd={handleAdd}
                      added={myShowIds.has(entry.show.id) || adding.has(entry.show.id)}
                      compact
                      extra={
                        <p className="text-xs text-amber-400/80 mt-2">
                          Similar to {entry.similarTo.slice(0, 3).join(", ")}
                          {entry.similarTo.length > 3 && ` +${entry.similarTo.length - 3} more`}
                        </p>
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
