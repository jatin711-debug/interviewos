"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { EditorProps } from "@monaco-editor/react";
import { configureEditorAssistance } from "@/lib/editor-assistance";
import { asset } from "@/lib/base-path";

/** Served from public/ (copied by scripts/sync-monaco.mjs) so the editor never waits on a CDN. */
const MONACO_VS_PATH = asset("/monaco/vs");

const Editor = dynamic(async () => {
  const { default: Component, loader } = await import("@monaco-editor/react");
  loader.config({ paths: { vs: MONACO_VS_PATH } });
  return Component;
}, { ssr: false });

type MonacoEditorProps = EditorProps & {
  /**
   * Create the editor straight away. By default it waits until the editor is close to the
   * viewport: starting Monaco blocks the main thread, so editors further down the page should
   * not freeze it while it loads.
   */
  eager?: boolean;
};

/** Monaco, loaded locally and only created when it is about to be seen. Give the parent a height. */
/** True on phone-width screens, where the editor trims its gutter to leave room for code. */
function useNarrowScreen() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

export function MonacoEditor({ eager = false, beforeMount, onMount, options, ...props }: MonacoEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const narrow = useNarrowScreen();
  const fitted = narrow ? { ...options, lineNumbersMinChars: 2, lineDecorationsWidth: 6, glyphMargin: false, folding: false, fontSize: Math.min(options?.fontSize ?? 14, 13) } : options;
  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "150px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={ref} className="relative h-full w-full">
    {visible ? <Editor {...props} options={fitted} beforeMount={monaco => { configureEditorAssistance(monaco); beforeMount?.(monaco); }} onMount={onMount} /> : props.loading}
  </div>;
}
