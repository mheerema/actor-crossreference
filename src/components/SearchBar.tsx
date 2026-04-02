"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface SearchBarProps {
  onResults: (results: unknown[]) => void;
  onLoading: (loading: boolean) => void;
  onError?: (error: string | null) => void;
  placeholder?: string;
}

export default function SearchBar({ onResults, onLoading, onError, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    onLoading(true);
    onError?.(null);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        onError?.(data.error || "Search failed");
        onResults([]);
      } else {
        onResults(data);
      }
    } catch {
      onError?.("Network error — please try again");
      onResults([]);
    } finally {
      onLoading(false);
    }
  }, [onResults, onLoading, onError]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(value), 400);
    }
  }, [search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && search(query)}
        placeholder={placeholder ?? "Search for a TV show..."}
        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
      />
      <button
        onClick={() => search(query)}
        className="px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
      >
        Search
      </button>
    </div>
  );
}
