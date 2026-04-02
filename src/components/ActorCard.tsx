"use client";

import Image from "next/image";
import Link from "next/link";

interface ActorCardProps {
  id: number;
  name: string;
  profile_path: string | null;
  shows: { showName: string; character: string }[];
}

export default function ActorCard({ id, name, profile_path, shows }: ActorCardProps) {
  const photoUrl = profile_path
    ? `https://image.tmdb.org/t/p/w185${profile_path}`
    : null;

  return (
    <Link
      href={`/actor/${id}`}
      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-500/50 transition-colors flex flex-col"
    >
      <div className="relative h-48 bg-slate-700">
        {photoUrl ? (
          <Image src={photoUrl} alt={name} fill className="object-cover object-top" sizes="185px" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-4xl">?</div>
        )}
        <div className="absolute top-2 right-2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">
          {shows.length} shows
        </div>
      </div>
      <div className="p-3 flex-1">
        <h3 className="font-semibold text-white">{name}</h3>
        <div className="mt-2 space-y-1">
          {shows.map((s, i) => (
            <p key={i} className="text-xs text-slate-400">
              <span className="text-slate-300">{s.showName}</span>
              {s.character && <> as {s.character}</>}
            </p>
          ))}
        </div>
      </div>
    </Link>
  );
}
