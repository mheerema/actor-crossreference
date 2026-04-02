"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ExternalRatings from "@/components/ExternalRatings";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface ShowDetails {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genres?: { id: number; name: string }[];
  vote_average: number;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [myShowIds, setMyShowIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tmdb/show/${id}/credits`).then((r) => r.json()),
      fetch("/api/shows").then((r) => r.json()),
    ])
      .then(([castData, shows]) => {
        if (Array.isArray(castData)) {
          setCast(castData.slice(0, 50));
        }
        if (Array.isArray(shows)) {
          setMyShowIds(new Set(shows.map((s: { id: number }) => s.id)));
          // If this show is already in collection, we still show the preview
          const existing = shows.find((s: { id: number }) => s.id === Number(id));
          if (existing) {
            setShow(existing);
            setLoading(false);
            return;
          }
        }
        // Fetch show details from TMDB
        fetch(`/api/tmdb/show/${id}/details`)
          .then((r) => r.json())
          .then((details) => {
            if (details.error) {
              setError(details.error);
            } else {
              setShow(details);
            }
          })
          .catch(() => setError("Failed to load show details"))
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setError("Failed to load show info");
        setLoading(false);
      });
  }, [id]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: Number(id) }),
      });
      if (res.ok) {
        setJustAdded(true);
        setMyShowIds((prev) => new Set(prev).add(Number(id)));
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <p className="text-slate-400">{error || "Show not found"}</p>
          <Link href="/shows" className="text-amber-400 hover:text-amber-300 mt-4 inline-block">
            &larr; Back to My Shows
          </Link>
        </div>
      </div>
    );
  }

  const inCollection = myShowIds.has(show.id);
  const year = show.first_air_date?.split("-")[0] ?? "N/A";
  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
    : null;
  const genres = show.genres?.map((g) => g.name) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => window.history.back()}
        className="text-amber-400 hover:text-amber-300 text-sm mb-6 inline-block"
      >
        &larr; Back
      </button>

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="flex-shrink-0">
          <div className="relative w-48 h-72 rounded-lg overflow-hidden bg-slate-800">
            {posterUrl ? (
              <Image src={posterUrl} alt={show.name} fill className="object-cover" sizes="192px" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">No poster</div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{show.name}</h1>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-slate-400">{year}</span>
            {show.vote_average > 0 && (
              <span className="bg-amber-500 text-slate-900 text-sm font-bold px-2 py-0.5 rounded">
                {show.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          <ExternalRatings showName={show.name} />
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 mt-3">
              {genres.map((g) => (
                <span key={g} className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}
          <p className="text-slate-300 leading-relaxed max-w-2xl mb-6">{show.overview}</p>

          {inCollection && !justAdded ? (
            <Link
              href={`/show/${show.id}`}
              className="inline-block px-6 py-3 bg-green-600/20 text-green-400 font-semibold rounded-lg"
            >
              In your collection &rarr;
            </Link>
          ) : justAdded ? (
            <Link
              href={`/show/${show.id}`}
              className="inline-block px-6 py-3 bg-green-600/20 text-green-400 font-semibold rounded-lg"
            >
              Added! View in collection &rarr;
            </Link>
          ) : (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add to My Shows"}
            </button>
          )}
        </div>
      </div>

      {cast.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Cast ({cast.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cast.map((member, i) => {
              const photoUrl = member.profile_path
                ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                : null;
              return (
                <Link
                  key={`${member.id}-${i}`}
                  href={`/actor/${member.id}`}
                  className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors"
                >
                  <div className="relative h-36 bg-slate-700">
                    {photoUrl ? (
                      <Image src={photoUrl} alt={member.name} fill className="object-cover object-top" sizes="185px" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 text-3xl">?</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    {member.character && (
                      <p className="text-xs text-slate-400 truncate">as {member.character}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
