"use client";

import { useEffect, useState } from "react";

interface RatingsData {
  configured: boolean;
  found?: boolean;
  ratings?: {
    imdbRating: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
  };
  totalSeasons?: string | null;
}

export default function ExternalRatings({ showName }: { showName: string }) {
  const [data, setData] = useState<RatingsData | null>(null);

  useEffect(() => {
    if (!showName) return;
    fetch(`/api/omdb/${encodeURIComponent(showName)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [showName]);

  if (!data || !data.configured || !data.found || !data.ratings) return null;

  const { imdbRating, rottenTomatoes, metacritic } = data.ratings;
  const hasAny = imdbRating || rottenTomatoes || metacritic;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      {imdbRating && (
        <span className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 text-sm font-medium px-2.5 py-1 rounded-lg">
          <span className="font-bold">IMDb</span> {imdbRating}
        </span>
      )}
      {rottenTomatoes && (
        <span className="flex items-center gap-1.5 bg-red-500/15 text-red-400 text-sm font-medium px-2.5 py-1 rounded-lg">
          <span className="font-bold">RT</span> {rottenTomatoes}
        </span>
      )}
      {metacritic && (
        <span className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-sm font-medium px-2.5 py-1 rounded-lg">
          <span className="font-bold">MC</span> {metacritic}
        </span>
      )}
      {data.totalSeasons && (
        <span className="text-slate-500 text-sm">
          {data.totalSeasons} season{data.totalSeasons !== "1" ? "s" : ""}
        </span>
      )}
    </div>
  );
}
