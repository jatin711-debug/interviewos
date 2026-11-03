// Copies Monaco's prebuilt editor into public/monaco/vs so the editor loads from this app
// instead of the jsDelivr CDN. Runs after install and before dev/build; skips when up to date.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = path.join(root, "node_modules", "monaco-editor", "package.json");
const source = path.join(root, "node_modules", "monaco-editor", "min", "vs");
const target = path.join(root, "public", "monaco");
const marker = path.join(target, "VERSION");

if (!existsSync(pkg) || !existsSync(source)) {
  console.warn("[sync-monaco] monaco-editor is not installed; run `npm install`. Code editors will not load until it is.");
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(pkg, "utf8"));
if (existsSync(marker) && readFileSync(marker, "utf8").trim() === version && existsSync(path.join(target, "vs", "loader.js"))) process.exit(0);

rmSync(target, { recursive: true, force: true });
cpSync(source, path.join(target, "vs"), { recursive: true });
writeFileSync(marker, `${version}\n`);
console.log(`[sync-monaco] copied monaco-editor ${version} to public/monaco/vs`);
