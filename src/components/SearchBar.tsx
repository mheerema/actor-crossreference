"use client";

import { useState, useCallback } from "react";

interface SearchBarProps {
  onResults: (results: unknown[]) => void;
  onLoading: (loading: boolean) => void;
  placeholder?: string;
}

export default function SearchBar({ onResults, onLoading, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const search = useCallback(async () => {
    if (query.trim().length < 2) return;
    onLoading(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      onResults(data);
    } finally {
      onLoading(false);
    }
  }, [query, onResults, onLoading]);

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search()}
        placeholder={placeholder ?? "Search for a TV show..."}
        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
      />
      <button
        onClick={search}
        className="px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
      >
        Search
      </button>
    </div>
  );
}
