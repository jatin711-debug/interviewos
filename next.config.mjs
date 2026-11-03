/**
 * A fully static site: `next build` writes plain HTML/JS/CSS to out/, ready for GitHub Pages.
 * Python runs in the browser (Pyodide in a Web Worker) and progress is kept in localStorage,
 * so there is no server and no API routes.
 *
 * NEXT_PUBLIC_BASE_PATH is the sub-path the site is served from, e.g. "/interviewos" for
 * https://<user>.github.io/interviewos/. Leave it unset for local development.
 * @type {import('next').NextConfig}
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true, // /dsa -> /dsa/index.html, which static hosts serve without rewrites
  images: { unoptimized: true },
  reactStrictMode: false,
  turbopack: {},
};

export default nextConfig;
