import type { ReactNode } from "react";

/** Render `inline code` and **bold** spans inside a short piece of lesson text. */
export function rich(value: string): ReactNode[] {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-[#0d1718] px-1.5 py-0.5 font-mono text-[0.85em] text-[#d7f2c3]">{part.slice(1, -1)}</code>;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-[#eef6e9]">{part.slice(2, -2)}</strong>;
    return part;
  });
}
