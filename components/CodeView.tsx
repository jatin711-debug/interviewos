"use client";

import { Fragment, useMemo } from "react";
import { highlightCode, type HighlightLanguage } from "@/lib/code-highlight";

const TAB_SIZE = 4;

/** Monaco's indent-guide levels: content lines use their own indent, blank lines borrow from their neighbours. */
function indentGuides(lines: string[]): number[] {
  const indents = lines.map(line => {
    if (!line.trim()) return -1;
    let width = 0;
    for (const char of line) {
      if (char === " ") width += 1;
      else if (char === "\t") width += TAB_SIZE - (width % TAB_SIZE);
      else break;
    }
    return width;
  });
  return indents.map((indent, index) => {
    if (indent >= 0) return Math.ceil(indent / TAB_SIZE);
    let above = -1, below = -1;
    for (let i = index - 1; i >= 0 && above < 0; i--) above = indents[i];
    for (let i = index + 1; i < indents.length && below < 0; i++) below = indents[i];
    if (above < 0 || below < 0) return 0;
    if (above < below) return 1 + Math.floor(above / TAB_SIZE);
    if (above === below) return Math.ceil(below / TAB_SIZE);
    return 1 + Math.floor(below / TAB_SIZE);
  });
}

/**
 * Read-only code that looks like the Monaco editor (vs-dark colours, bracket colours, line numbers,
 * indent guides) but is plain HTML, so it costs nothing to show. Give the parent a height.
 */
export function CodeView({ code, language, label = "Code" }: { code: string; language: HighlightLanguage; label?: string }) {
  const { tokens, guides } = useMemo(() => {
    const lines = code.split("\n");
    return { tokens: highlightCode(code, language), guides: indentGuides(lines) };
  }, [code, language]);

  return <div role="region" aria-label={label} tabIndex={0} className="h-full overflow-auto bg-[#1e1e1e] [font-family:Consolas,'Courier_New',monospace] text-[12px] leading-[21px] sm:text-[13px] outline-none [font-feature-settings:'liga'_0,'calt'_0] [tab-size:4] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#3c5a46]">
    <div className="flex min-w-max py-[14px]">
      <div aria-hidden="true" className="sticky left-0 z-[1] w-[38px] shrink-0 select-none bg-[#1e1e1e] pr-3 text-right text-[#858585] sm:w-[62px] sm:pr-[26px]">
        {tokens.map((_, index) => <div key={index}>{index + 1}</div>)}
      </div>
      <div className="relative pr-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {guides.map((level, index) => level > 0 && <div key={index} className="absolute left-0 h-[21px] bg-[linear-gradient(to_right,#404040_1px,transparent_1px)] bg-[length:4ch_100%] bg-repeat-x" style={{ top: index * 21, width: `${level * TAB_SIZE}ch` }} />)}
        </div>
        <pre className="relative m-0 text-[#d4d4d4] [font:inherit] selection:bg-[#264f78]"><code className="[font:inherit]">{tokens.map((line, index) => <Fragment key={index}>
          {line.map((token, part) => <span key={part} style={{ color: token.color }}>{token.text}</span>)}
          {index < tokens.length - 1 ? "\n" : null}
        </Fragment>)}</code></pre>
      </div>
    </div>
  </div>;
}
