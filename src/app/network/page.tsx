"use client";

import dynamic from "next/dynamic";

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400">
      Loading graph...
    </div>
  ),
});

export default function NetworkPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-4 py-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">Actor Network</h1>
        <p className="text-slate-400 text-sm">
          Actors appearing in 2+ of your shows. Gold nodes are shows, purple nodes are actors. Click an actor for details.
        </p>
      </div>
      <div className="flex-1">
        <NetworkGraph className="w-full h-full" />
      </div>
    </div>
  );
}
