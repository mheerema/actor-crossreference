"use client";

import { useEffect, useState } from "react";
import ShowCard from "@/components/ShowCard";

interface Rec {
  show: {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
    overview: string;
    vote_average: number;
  };
  recommendedBy: string[];
  count: number;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/recommendations").then((r) => r.json()),
      fetch("/api/dismissed").then((r) => r.json()),
    ]).then(([recData, dismissedData]) => {
      if (Array.isArray(recData)) setRecs(recData);
      if (Array.isArray(dismissedData)) setDismissed(new Set(dismissedData));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async (showId: number) => {
    setAdding((prev) => new Set(prev).add(showId));
    await fetch("/api/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId }),
    });
    setAdding((prev) => {
      const next = new Set(prev);
      next.delete(showId);
      return next;
    });
    setAdded((prev) => new Set(prev).add(showId));
  };

  const handleDismiss = async (showId: number) => {
    setDismissed((prev) => new Set(prev).add(showId));
    await fetch("/api/dismissed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId }),
    });
  };

  const handleUndismiss = async (showId: number) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.delete(showId);
      return next;
    });
    await fetch("/api/dismissed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId, undo: true }),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-lg">Loading recommendations...</div>
      </div>
    );
  }

  const visibleRecs = recs.filter((r) => !dismissed.has(r.show.id));
  const dismissedRecs = recs.filter((r) => dismissed.has(r.show.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Discover New Shows</h1>
      <p className="text-slate-400 mb-8">
        Shows recommended based on your collection, ranked by how many of your shows suggest them.
      </p>

      {recs.length === 0 ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <p className="text-slate-400">
            Add at least one show to get recommendations.
          </p>
        </div>
      ) : (
        <>
          {visibleRecs.length === 0 ? (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center mb-6">
              <p className="text-slate-400">
                You&apos;ve dismissed all recommendations. Add more shows to get new ones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleRecs.map((rec) => (
                <ShowCard
                  key={rec.show.id}
                  id={rec.show.id}
                  name={rec.show.name}
                  poster_path={rec.show.poster_path}
                  first_air_date={rec.show.first_air_date}
                  overview={rec.show.overview}
                  vote_average={rec.show.vote_average}
                  onAdd={handleAdd}
                  onDismiss={handleDismiss}
                  added={added.has(rec.show.id) || adding.has(rec.show.id)}
                  compact
                  extra={
                    <div className="mt-2">
                      <p className="text-xs text-amber-400 font-medium">
                        Recommended by {rec.count} of your shows
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rec.recommendedBy.join(", ")}
                      </p>
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {dismissedRecs.length > 0 && (
            <div className="mt-10">
              <button
                onClick={() => setShowDismissed(!showDismissed)}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                {showDismissed ? "Hide" : "Show"} {dismissedRecs.length} dismissed recommendation{dismissedRecs.length !== 1 && "s"}
              </button>
              {showDismissed && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 opacity-60">
                  {dismissedRecs.map((rec) => (
                    <div key={rec.show.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex flex-col">
                      <div className="relative h-48 bg-slate-700">
                        {rec.show.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${rec.show.poster_path}`}
                            alt={rec.show.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-500">No poster</div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-white text-lg leading-tight">{rec.show.name}</h3>
                        <div className="mt-auto pt-3">
                          <button
                            onClick={() => handleUndismiss(rec.show.id)}
                            className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm font-medium transition-colors"
                          >
                            Undo dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
