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
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    onLoading(true);
    onError?.(null);
    try {
      const res = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok) {
        onError?.(data.error || "Search failed");
        onResults([]);
      } else {
        onResults(data);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      onError?.("Network error — please try again");
      onResults([]);
    } finally {
      if (!controller.signal.aborted) {
        onLoading(false);
      }
    }
  }, [onResults, onLoading, onError]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(value), 500);
    } else {
      // Clear results and cancel pending requests when query is too short
      if (abortRef.current) abortRef.current.abort();
      onLoading(false);
      onResults([]);
    }
  }, [search, onLoading, onResults]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
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
