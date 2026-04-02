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
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((data) => {
        setRecs(data);
        setLoading(false);
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-lg">Loading recommendations...</div>
      </div>
    );
  }

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recs.map((rec) => (
            <ShowCard
              key={rec.show.id}
              id={rec.show.id}
              name={rec.show.name}
              poster_path={rec.show.poster_path}
              first_air_date={rec.show.first_air_date}
              overview={rec.show.overview}
              vote_average={rec.show.vote_average}
              onAdd={handleAdd}
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
    </div>
  );
}
