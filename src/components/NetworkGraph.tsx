"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface CrossRef {
  actor: { id: number; name: string; profile_path: string | null };
  shows: { showId: number; showName: string; character: string }[];
}

interface GraphNode {
  id: string;
  label: string;
  type: "actor" | "show";
  val: number;
  color: string;
  actorId?: number;
}

interface GraphLink {
  source: string;
  target: string;
  character: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function buildGraph(crossRefs: CrossRef[], showNames: Map<number, string>): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  // Add show nodes
  for (const [showId, showName] of showNames) {
    const id = `show-${showId}`;
    if (!nodeIds.has(id)) {
      nodes.push({
        id,
        label: showName,
        type: "show",
        val: 12,
        color: "#f59e0b",
      });
      nodeIds.add(id);
    }
  }

  // Add actor nodes and links
  for (const ref of crossRefs) {
    const actorNodeId = `actor-${ref.actor.id}`;
    if (!nodeIds.has(actorNodeId)) {
      nodes.push({
        id: actorNodeId,
        label: ref.actor.name,
        type: "actor",
        val: 4 + ref.shows.length * 3,
        color: "#6366f1",
        actorId: ref.actor.id,
      });
      nodeIds.add(actorNodeId);
    }

    for (const show of ref.shows) {
      links.push({
        source: actorNodeId,
        target: `show-${show.showId}`,
        character: show.character,
      });
    }
  }

  return { nodes, links };
}

export default function NetworkGraph({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [ForceGraph, setForceGraph] = useState<typeof import("react-force-graph-2d").default | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const router = useRouter();

  useEffect(() => {
    import("react-force-graph-2d").then((mod) => setForceGraph(() => mod.default));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/crossreference").then((r) => r.json()),
      fetch("/api/shows").then((r) => r.json()),
    ]).then(([crossRefs, shows]: [CrossRef[], { id: number; name: string }[]]) => {
      const showNames = new Map(shows.map((s) => [s.id, s.name]));
      setGraphData(buildGraph(crossRefs, showNames));
    });
  }, []);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "actor" && node.actorId) {
        router.push(`/actor/${node.actorId}`);
      }
    },
    [router]
  );

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const fontSize = Math.max(10 / globalScale, 2);
      const nodeR = Math.sqrt(node.val) * 2;
      const x = (node as unknown as { x: number }).x;
      const y = (node as unknown as { y: number }).y;

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Draw border for shows
      if (node.type === "show") {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      // Draw label
      ctx.font = `${node.type === "show" ? "bold " : ""}${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = node.type === "show" ? "#fbbf24" : "#cbd5e1";
      ctx.fillText(node.label, x, y + nodeR + 2 / globalScale);
    },
    []
  );

  if (!graphData || !ForceGraph) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading graph...
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Add at least 2 shows to see the network.
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className || "w-full h-full"}>
      <ForceGraph
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) =>
          drawNode(node as GraphNode, ctx, globalScale)
        }
        nodePointerAreaPaint={(node: unknown, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as GraphNode & { x: number; y: number };
          const nodeR = Math.sqrt(n.val) * 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeR + 4, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node: unknown) => handleNodeClick(node as GraphNode)}
        linkColor={() => "rgba(148, 163, 184, 0.3)"}
        linkWidth={1}
        backgroundColor="transparent"
        cooldownTicks={100}
      />
    </div>
  );
}
