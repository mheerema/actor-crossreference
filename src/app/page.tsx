"use client";

import { useEffect, useState } from "react";
import ActorCard from "@/components/ActorCard";
import Link from "next/link";
import Image from "next/image";

interface Show {
  id: number;
  name: string;
  poster_path: string | null;
}

interface CrossRef {
  actor: { id: number; name: string; profile_path: string | null };
  shows: { showId: number; showName: string; character: string }[];
}

export default function Dashboard() {
  const [shows, setShows] = useState<Show[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shows").then((r) => r.json()),
      fetch("/api/crossreference").then((r) => r.json()),
    ]).then(([s, c]) => {
      setShows(s);
      setCrossRefs(c);
      setLoading(false);
    });
  }, []);

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
                <div
                  key={s.id}
                  className="flex-shrink-0 w-28 rounded-lg overflow-hidden border border-slate-700"
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
                </div>
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
        </>
      )}
    </div>
  );
}
