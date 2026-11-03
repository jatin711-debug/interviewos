"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Expand, Minus, Plus, RotateCcw } from "lucide-react";
import type { Mermaid } from "mermaid";

// Mermaid and its layout engines are well over 1 MB, so the library is only downloaded when a
// diagram is about to be shown, initialised once, and every rendered chart is cached for revisits.
const MERMAID_CONFIG = {
  startOnLoad: false, securityLevel: "strict", theme: "base",
  fontFamily: "Segoe UI, system-ui, sans-serif",
  flowchart: { htmlLabels: true, curve: "basis", nodeSpacing: 42, rankSpacing: 55, useMaxWidth: false, wrappingWidth: 200 },
  themeVariables: {
    darkMode: true, background: "#111a20", primaryColor: "#24372f", primaryTextColor: "#eaf5e8", primaryBorderColor: "#799c79",
    secondaryColor: "#1d3030", tertiaryColor: "#172723", lineColor: "#9bb9aa", textColor: "#e2efe6",
    clusterBkg: "#15241f", clusterBorder: "#456054", edgeLabelBackground: "#111d1b", fontSize: "15px",
    actorBkg: "#24372f", actorBorder: "#799c79", actorTextColor: "#eaf5e8", signalColor: "#a6c3b0", signalTextColor: "#eaf5e8",
    labelBoxBkgColor: "#1d3030", labelBoxBorderColor: "#456054", labelTextColor: "#eaf5e8", noteBkgColor: "#283b2c", noteTextColor: "#eaf5e8", noteBorderColor: "#799c79",
  },
  themeCSS: `.node rect, .node polygon, .node path { stroke-width: 1.4px; filter: none !important; } .node rect { rx: 9px; ry: 9px; } .cluster rect { rx: 12px; ry: 12px; } .edgeLabel rect { fill: #172522 !important; opacity: 1 !important; } .edgeLabel { color: #d4e6d9 !important; } .edgePath path { stroke-width: 1.5px; }`,
} as const;

let mermaidPromise: Promise<Mermaid> | null = null;
function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize(MERMAID_CONFIG);
    return mermaid;
  }).catch(error => { mermaidPromise = null; throw error; }); // let a later diagram retry a failed download
  return mermaidPromise;
}

type Rendered = { svg: string; width: number };
const rendered = new Map<string, Rendered>();
const MAX_CACHED = 60;
function remember(chart: string, value: Rendered) {
  if (rendered.size >= MAX_CACHED) rendered.delete(rendered.keys().next().value!);
  rendered.set(chart, value);
}

// Rendered SVGs are also kept in the browser's Cache API, so a diagram seen once loads on later
// visits without downloading or running mermaid. The key covers the chart and the config, so
// editing either renders afresh. Bump the version after upgrading mermaid.
const STORE = "interviewos-diagrams-v1";
async function storeKey(chart: string): Promise<string | null> {
  if (typeof caches === "undefined" || !globalThis.crypto?.subtle) return null; // e.g. plain http on a LAN address
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(MERMAID_CONFIG) + "\n" + chart));
  return `/__diagrams/${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}
async function readStored(chart: string): Promise<Rendered | null> {
  try {
    const key = await storeKey(chart);
    const hit = key && await (await caches.open(STORE)).match(key);
    if (!hit) return null;
    const value = await hit.json() as Rendered;
    return typeof value?.svg === "string" && typeof value.width === "number" ? value : null;
  } catch { return null; }
}
async function writeStored(chart: string, value: Rendered) {
  try {
    const key = await storeKey(chart);
    if (key) await (await caches.open(STORE)).put(key, new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } }));
  } catch { /* storage is best effort */ }
}

interface MermaidViewerProps { chart: string; className?: string }

export function MermaidViewer({ chart, className = "" }: MermaidViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState(() => rendered.get(chart)?.svg ?? "");
  const [naturalWidth, setNaturalWidth] = useState(() => rendered.get(chart)?.width ?? 900);
  const [viewportWidth, setViewportWidth] = useState(900);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);
  const [near, setNear] = useState(false);

  // Start rendering once the diagram is within a few hundred pixels of the viewport.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setNear(true);
      observer.disconnect();
    }, { rootMargin: "300px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setError(false); setZoom(1);
    const cached = rendered.get(chart);
    if (cached) { setSvg(cached.svg); setNaturalWidth(cached.width); return; }
    setSvg("");
    let live = true;
    const show = (value: Rendered) => {
      remember(chart, value);
      if (!live) return;
      setNaturalWidth(value.width);
      setSvg(value.svg);
    };
    readStored(chart).then(stored => {
      if (stored) { show(stored); return; }
      if (!live || !near) return; // render live once the diagram is close to the viewport
      return loadMermaid()
        .then(mermaid => mermaid.render(`diagram-${Math.random().toString(36).slice(2)}`, chart))
        .then(({ svg: markup }) => {
          const viewBox = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
          const value = { svg: markup, width: viewBox?.length === 4 && viewBox[2] > 0 ? viewBox[2] : 900 };
          void writeStored(chart, value);
          show(value);
        });
    }).catch(err => { console.error("Diagram render failed:", err); if (live) setError(true); });
    return () => { live = false; };
  }, [chart, near]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(entries => setViewportWidth(entries[0].contentRect.width));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  // Fit small diagrams, but keep complex ones legible and allow scrolling.
  const baseWidth = Math.max(naturalWidth * 0.7, Math.min(naturalWidth, Math.max(300, viewportWidth - 48)));
  const width = Math.round(baseWidth * zoom);
  const button = "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#34473e] px-2.5 text-xs font-medium text-[#c3d4c8] transition hover:bg-[#293a30] disabled:opacity-40";
  return <div ref={rootRef} className={`${expanded ? "fixed inset-3 z-[100] flex flex-col shadow-2xl sm:inset-8" : ""} overflow-hidden rounded-xl border border-[#30443a] bg-[#111c1b] ${className}`} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} aria-label={expanded ? "Expanded architecture diagram" : undefined}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30443a] bg-[#172620] px-4 py-2.5"><div><p className="text-xs font-semibold text-[#dcebdd]">Diagram canvas</p><p className="mt-0.5 text-[11px] text-[#8fa79a]">Scroll to explore · use controls to resize</p></div><div className="flex items-center gap-1.5"><button className={button} aria-label="Zoom out diagram" disabled={zoom <= 0.5} onClick={() => setZoom(value => Math.max(0.5, Math.round((value - 0.2) * 10) / 10))}><Minus className="h-3.5 w-3.5" /></button><span className="w-10 text-center font-mono text-xs text-[#afc8b3]">{Math.round(zoom * 100)}%</span><button className={button} aria-label="Zoom in diagram" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, Math.round((value + 0.2) * 10) / 10))}><Plus className="h-3.5 w-3.5" /></button><button className={button} onClick={() => setZoom(1)} title="Reset zoom"><RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline">Reset</span></button><button className={button} onClick={() => setExpanded(value => !value)}><Expand className="h-3.5 w-3.5" />{expanded ? "Close" : "Expand"}</button></div></div>
    <div ref={viewportRef} className={`overflow-auto bg-[#101b19] ${expanded ? "min-h-0 flex-1" : "max-h-[560px] min-h-[240px]"}`}>
      {error ? <div className="flex items-center gap-2 p-6 text-sm text-amber-200"><AlertTriangle className="h-4 w-4" /> Diagram could not be rendered. Try another topic or refresh the page.</div> : !svg ? <div className="p-6 text-sm text-[#8fa79a]">Rendering diagram…</div> : <div className="min-h-[240px] min-w-full w-max p-6"><div style={{ width }} className="mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none" dangerouslySetInnerHTML={{ __html: svg }} /></div>}
    </div>
  </div>;
}
