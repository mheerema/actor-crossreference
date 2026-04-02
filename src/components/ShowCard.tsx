"use client";

import Image from "next/image";
import Link from "next/link";

interface ShowCardProps {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genres?: string[];
  vote_average?: number;
  onRemove?: (id: number) => void;
  onAdd?: (id: number) => void;
  added?: boolean;
  compact?: boolean;
  extra?: React.ReactNode;
}

export default function ShowCard({
  id,
  name,
  poster_path,
  first_air_date,
  overview,
  genres,
  vote_average,
  onRemove,
  onAdd,
  added,
  compact,
  extra,
}: ShowCardProps) {
  const year = first_air_date?.split("-")[0] ?? "N/A";
  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w300${poster_path}`
    : null;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex flex-col">
      <div className={`relative ${compact ? "h-48" : "h-64"} bg-slate-700`}>
        {posterUrl ? (
          <Image src={posterUrl} alt={name} fill className="object-cover" sizes="300px" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">No poster</div>
        )}
        {vote_average != null && (
          <div className="absolute top-2 right-2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">
            {vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {onRemove ? (
          <Link href={`/show/${id}`} className="font-semibold text-white text-lg leading-tight hover:text-amber-400 transition-colors">
            {name}
          </Link>
        ) : (
          <h3 className="font-semibold text-white text-lg leading-tight">{name}</h3>
        )}
        <p className="text-slate-400 text-sm mt-1">{year}</p>
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
        )}
        {!compact && (
          <p className="text-slate-400 text-sm mt-2 line-clamp-3">{overview}</p>
        )}
        {extra}
        <div className="mt-auto pt-3">
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-sm font-medium transition-colors"
            >
              Remove
            </button>
          )}
          {onAdd && (
            <button
              onClick={() => onAdd(id)}
              disabled={added}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                added
                  ? "bg-green-600/20 text-green-400 cursor-default"
                  : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              }`}
            >
              {added ? "Added" : "Add to My Shows"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
