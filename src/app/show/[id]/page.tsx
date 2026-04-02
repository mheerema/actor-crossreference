"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

interface ShowData {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  genres: string[];
  vote_average: number;
  cast: CastMember[];
}

interface CrossRef {
  actor: { id: number; name: string; profile_path: string | null };
  shows: { showId: number; showName: string; character: string }[];
}

interface SeenBefore {
  actor: { id: number; name: string; profile_path: string | null };
  characterHere: string;
  otherShows: { showId: number; showName: string; character: string }[];
}

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<ShowData | null>(null);
  const [seenBefore, setSeenBefore] = useState<SeenBefore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/shows").then((r) => r.json()),
      fetch("/api/crossreference").then((r) => r.json()),
    ])
      .then(([shows, refs]) => {
        const found = Array.isArray(shows) ? shows.find((s: ShowData) => s.id === Number(id)) : null;
        if (!found) {
          setError("Show not found in your collection");
        } else {
          setShow(found);
          if (Array.isArray(refs)) {
            const castMap = new Map<number, CastMember>(found.cast.map((c: CastMember) => [c.id, c]));
            const seen: SeenBefore[] = [];
            for (const ref of refs as CrossRef[]) {
              const castMember = castMap.get(ref.actor.id);
              if (!castMember) continue;
              // Other shows = shows in the crossref that aren't the current show
              const otherShows = ref.shows.filter(
                (s: { showId: number }) => s.showId !== Number(id)
              );
              if (otherShows.length > 0) {
                seen.push({
                  actor: ref.actor,
                  characterHere: castMember.character,
                  otherShows,
                });
              }
            }
            // Sort by number of other shows (most appearances first)
            seen.sort((a, b) => b.otherShows.length - a.otherShows.length);
            setSeenBefore(seen);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load show details");
        setLoading(false);
      });
  }, [id]);

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

  const year = show.first_air_date?.split("-")[0] ?? "N/A";
  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w300${show.poster_path}`
    : null;

  const seenBeforeIds = new Set(seenBefore.map((s) => s.actor.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/shows" className="text-amber-400 hover:text-amber-300 text-sm mb-6 inline-block">
        &larr; Back to My Shows
      </Link>

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
          {show.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {show.genres.map((g) => (
                <span key={g} className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}
          <p className="text-slate-300 leading-relaxed max-w-2xl">{show.overview}</p>

          {seenBefore.length > 0 && (
            <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
              <p className="text-amber-400 text-sm font-medium">
                {seenBefore.length} actor{seenBefore.length !== 1 ? "s" : ""} you&apos;ve seen in other shows in your collection
              </p>
            </div>
          )}
        </div>
      </div>

      {seenBefore.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-1">
            Actors You&apos;ve Seen Before
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            These actors from {show.name} also appear in other shows in your collection.
          </p>
          <div className="space-y-4">
            {seenBefore.map((entry) => {
              const photoUrl = entry.actor.profile_path
                ? `https://image.tmdb.org/t/p/w185${entry.actor.profile_path}`
                : null;
              return (
                <div
                  key={entry.actor.id}
                  className="bg-slate-800 rounded-lg border border-amber-500/20 p-4 flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href={`/actor/${entry.actor.id}`}
                    className="flex-shrink-0 flex items-start gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="relative w-16 h-20 rounded-md overflow-hidden bg-slate-700 flex-shrink-0">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={entry.actor.name}
                          fill
                          className="object-cover object-top"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-xl">?</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{entry.actor.name}</p>
                      <p className="text-slate-400 text-sm">
                        {entry.characterHere && (
                          <>as <span className="text-slate-300">{entry.characterHere}</span> in this show</>
                        )}
                      </p>
                    </div>
                  </Link>
                  <div className="sm:ml-auto flex flex-wrap gap-2">
                    {entry.otherShows.map((s) => (
                      <Link
                        key={s.showId}
                        href={`/show/${s.showId}`}
                        className="bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 transition-colors"
                      >
                        <p className="text-sm text-amber-400 font-medium">{s.showName}</p>
                        {s.character && (
                          <p className="text-xs text-slate-400">as {s.character}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">
          Full Cast ({show.cast.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {show.cast.map((member, i) => {
            const photoUrl = member.profile_path
              ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
              : null;
            const isCrossover = seenBeforeIds.has(member.id);
            return (
              <Link
                key={`${member.id}-${i}`}
                href={`/actor/${member.id}`}
                className={`bg-slate-800 rounded-lg overflow-hidden border transition-colors ${
                  isCrossover
                    ? "border-amber-500/40 hover:border-amber-500"
                    : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <div className="relative h-36 bg-slate-700">
                  {photoUrl ? (
                    <Image src={photoUrl} alt={member.name} fill className="object-cover object-top" sizes="185px" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-3xl">?</div>
                  )}
                  {isCrossover && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded">
                      Seen before
                    </div>
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
    </div>
  );
}
