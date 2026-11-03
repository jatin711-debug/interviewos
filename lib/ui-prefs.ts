// Collapsible layout panels. Each preference lives in localStorage and is mirrored onto
// <html data-*="collapsed">, which the Tailwind variants `sidebar-collapsed:` and
// `library-collapsed:` read. UI_PREFS_SCRIPT runs in <head> before the first paint,
// so a collapsed panel never flashes open on load.

export const UI_PREFS = {
  sidebar: { key: "interviewos:ui:sidebar", attr: "data-sidebar" },
  dsaLibrary: { key: "interviewos:ui:dsa-library", attr: "data-dsa-library" },
} as const;
export type UiPref = keyof typeof UI_PREFS;

export const UI_PREFS_SCRIPT = `(function(){try{${Object.values(UI_PREFS)
  .map(pref => `if(localStorage.getItem(${JSON.stringify(pref.key)})==="collapsed")document.documentElement.setAttribute(${JSON.stringify(pref.attr)},"collapsed");`)
  .join("")}}catch(e){}})()`;

function apply(pref: UiPref, collapsed: boolean) {
  const { attr } = UI_PREFS[pref];
  if (collapsed) document.documentElement.setAttribute(attr, "collapsed");
  else document.documentElement.removeAttribute(attr);
}

/** Reads the stored preference and re-applies it (React can reset <html> attributes on a dev remount). */
export function readCollapsed(pref: UiPref): boolean {
  let collapsed = false;
  try { collapsed = localStorage.getItem(UI_PREFS[pref].key) === "collapsed"; } catch { /* storage unavailable */ }
  apply(pref, collapsed);
  return collapsed;
}

export function writeCollapsed(pref: UiPref, collapsed: boolean) {
  apply(pref, collapsed);
  try { localStorage.setItem(UI_PREFS[pref].key, collapsed ? "collapsed" : "expanded"); } catch { /* still applied for this page */ }
}
