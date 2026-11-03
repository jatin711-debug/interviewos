/**
 * The site can be served from a sub-path (GitHub Pages serves a project at /<repo-name>/).
 * next/link and the router add basePath automatically; plain URLs (workers, Monaco's files) need asset().
 * NEXT_PUBLIC_BASE_PATH is set at build time (see next.config.mjs and .github/workflows/deploy.yml).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a path under public/ with the base path, e.g. asset("/python-worker.mjs"). */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
