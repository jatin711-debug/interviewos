// Smoke test: server-render every panel of every step of every visual, plus each lesson page's player.
//   node scripts/render-ds-viz.cjs
// Catches runtime render errors (bad data shapes, layout math producing NaN) without a browser.
const path = require("node:path");
const Module = require("node:module");
const ROOT = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) request = path.join(ROOT, request.slice(2));
  return resolve.call(this, request, ...rest);
};
require("sucrase/register");
const React = require("react");
globalThis.React = React; // sucrase/register compiles JSX with the classic runtime
const { renderToStaticMarkup } = require("react-dom/server");
const { PanelView, Visualizer } = require(path.join(ROOT, "components/ds-viz/Visualizer.tsx"));
const { DS_TRACES } = require(path.join(ROOT, "lib/ds-viz/traces/index.ts"));

let errors = 0, panels = 0;
for (const [id, build] of Object.entries(DS_TRACES)) {
  const visuals = build();
  try { const html = renderToStaticMarkup(React.createElement(Visualizer, { visuals })); if (/NaN|undefined/.test(html)) throw new Error("player HTML contains NaN/undefined"); }
  catch (error) { errors++; console.log(`ERROR ${id} player: ${error.message}`); }
  for (const visual of visuals) visual.steps.forEach((step, i) => step.panels.forEach(panel => {
    panels++;
    try {
      const html = renderToStaticMarkup(React.createElement(PanelView, { panel }));
      if (/NaN|>undefined</.test(html)) throw new Error(`HTML contains NaN/undefined`);
    } catch (error) { errors++; console.log(`ERROR ${id} "${visual.title}" step ${i + 1} ${panel.type}: ${error.message}`); }
  }));
}
console.log(`Rendered ${panels} panels across ${Object.keys(DS_TRACES).length} lessons: ${errors} error(s).`);
process.exit(errors ? 1 : 0);
