"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Braces, CalendarDays, Code2, Database, Flame, GraduationCap, Layers3, LayoutGrid, MessagesSquare, Network, Menu, PanelLeftClose, PanelLeftOpen, User, X } from "lucide-react";
import type { UserState } from "@/lib/storage";
import { readCollapsed, writeCollapsed } from "@/lib/ui-prefs";
import { apiFetch } from "@/lib/local-api";

const groups = [
  { label: "WORKSPACE", items: [
    { name: "Overview", href: "/", icon: LayoutGrid },
    { name: "Code playground", href: "/python-playground", icon: Braces },
  ] },
  { label: "YOUR LEARNING", items: [
    { name: "Python foundations", href: "/python-course", icon: GraduationCap },
    { name: "Data structures & algorithms", href: "/ds-course", icon: Layers3 },
    { name: "DSA practice", href: "/dsa", icon: Code2 },
    { name: "Low-level design", href: "/lld", icon: Layers3 },
    { name: "System design", href: "/hld", icon: Network },
    { name: "Databases", href: "/databases", icon: Database },
    { name: "CS fundamentals", href: "/cs-fundamentals", icon: BookOpen },
    { name: "Interview prep", href: "/grill-me", icon: MessagesSquare },
  ] },
];
const items = groups.flatMap(group => group.items);
const tooltip = "pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-[#33413a] bg-[#1b252b] px-2.5 py-1.5 text-xs font-medium text-[#e6efe9] shadow-lg shadow-black/40 sidebar-collapsed:group-hover:block sidebar-collapsed:group-focus-visible:block";

function Brand({ size = "h-8 w-8" }: { size?: string }) {
  return <span className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-[#c9f27b] text-[13px] font-black tracking-[-0.06em] text-[#182119]`}>io</span>;
}

export function Sidebar() {
  // With trailingSlash the router may report "/dsa/"; nav hrefs have no trailing slash.
  const pathname = usePathname().replace(/(.)\/$/, "$1");
  const [profile, setProfile] = useState<UserState["profile"] | null>(null);
  const [days, setDays] = useState<number | null>(null);
  // Visual state comes from <html data-sidebar>; this only keeps aria-expanded accurate.
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = items.find(item => item.href === pathname);

  useLayoutEffect(() => { setCollapsed(readCollapsed("sidebar")); }, []);
  function toggle() {
    const next = !collapsed;
    writeCollapsed("sidebar", next);
    setCollapsed(next);
  }

  // Refresh on navigation so the streak reflects practice done on other pages.
  useEffect(() => {
    apiFetch("/api/state").then(response => {
      if (!response.ok) throw new Error("Unable to load profile");
      return response.json() as Promise<UserState>;
    }).then(state => setProfile(state.profile)).catch(() => {});
  }, [pathname]);
  // Close the phone menu on navigation and with Escape.
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  useEffect(() => {
    if (!profile?.targetDate) return;
    const update = () => setDays(Math.max(0, Math.ceil((new Date(profile.targetDate).getTime() - Date.now()) / 86_400_000)));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [profile?.targetDate]);

  const initials = profile?.name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
  const streak = !profile ? "Personal workspace" : profile.currentStreak ? `${profile.currentStreak} day streak` : "Practice today to start a streak";
  const targetDate = profile?.targetDate ? new Date(profile.targetDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Loading…";

  return <>
    <div className="sticky top-0 z-40 border-b border-[#27313b] bg-[#10161d]/95 backdrop-blur md:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5"><Brand /><span className="text-sm font-semibold tracking-tight text-white">interview<span className="text-[#c9f27b]">os</span></span></Link>
        <span className="ml-auto truncate text-xs text-[#8a9b8f]">{current?.name}</span>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-nav" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2c3838] text-[#d4dfd8] active:bg-[#1a232b]">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}<span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {menuOpen && <div aria-hidden="true" onClick={() => setMenuOpen(false)} className="fixed inset-x-0 bottom-0 top-14 bg-black/50" />}
      {menuOpen && <nav id="mobile-nav" aria-label="Main navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-y border-[#202a33] bg-[#10161d] px-3 pb-4 pt-2 shadow-2xl shadow-black/60">
        {groups.map(group => <div key={group.label} className="mt-2">
          <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-bold tracking-[0.14em] text-[#6f7d89]">{group.label}</p>
          <div className="grid grid-cols-1 gap-0.5 min-[480px]:grid-cols-2">{group.items.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium ${active ? "bg-[#263428] text-[#d6f6a5]" : "text-[#b3c0ca] active:bg-[#1a232b]"}`}>
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#c9f27b]" : "text-[#71818e]"}`} strokeWidth={1.8} />{item.name}
            </Link>;
          })}</div>
        </div>)}
        <p className="mt-4 flex items-center gap-2 border-t border-[#202a33] px-2.5 pt-3 text-xs text-[#82909a]"><CalendarDays className="h-3.5 w-3.5 text-[#c9f27b]" />{days ?? "—"} days to go<span className="text-[#4f5d66]">·</span><Flame className="h-3.5 w-3.5 text-[#c9f27b]" />{streak}</p>
      </nav>}
    </div>

    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r border-[#27313b] bg-[#10161d] transition-[width] duration-200 md:flex">
      <div className="flex items-center gap-2 px-3 pb-4 pt-4 sidebar-collapsed:flex-col sidebar-collapsed:px-2">
        <Link href="/" className="group relative flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1 sidebar-collapsed:flex-none sidebar-collapsed:px-0">
          <Brand />
          <span className="min-w-0 sidebar-collapsed:hidden"><span className="block text-[15px] font-bold leading-5 tracking-[-0.04em] text-[#f3f6f4]">interview<span className="text-[#c9f27b]">os.</span></span><span className="block text-[9px] font-medium tracking-[0.14em] text-[#758390]">YOUR PREP SPACE</span></span>
          <span className={tooltip}>Overview</span>
        </Link>
        <button onClick={toggle} aria-expanded={!collapsed} aria-controls="app-sidebar" className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7d8b97] transition hover:bg-[#1a232b] hover:text-[#e6eeeb]">
          <PanelLeftClose className="h-4 w-4 sidebar-collapsed:hidden" strokeWidth={1.8} />
          <PanelLeftOpen className="hidden h-4 w-4 sidebar-collapsed:block" strokeWidth={1.8} />
          <span className="sr-only"><span className="sidebar-collapsed:hidden">Collapse navigation</span><span className="hidden sidebar-collapsed:inline">Expand navigation</span></span>
          <span className={tooltip} aria-hidden="true">Expand navigation</span>
        </button>
      </div>

      <nav id="app-sidebar" aria-label="Main navigation" className="flex-1 overflow-y-auto px-2.5 pb-3 sidebar-collapsed:overflow-visible sidebar-collapsed:px-2">
        {groups.map((group, index) => <div key={group.label} className="mb-4">
          <p className="mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.14em] text-[#6f7d89] sidebar-collapsed:hidden">{group.label}</p>
          {index > 0 && <div aria-hidden="true" className="mx-2 mb-3 hidden border-t border-[#25303a] sidebar-collapsed:block" />}
          <div className="space-y-0.5">{group.items.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.name} className={`group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition sidebar-collapsed:justify-center sidebar-collapsed:px-0 ${active ? "bg-[#263428] text-[#d6f6a5]" : "text-[#9ba9b5] hover:bg-[#1a232b] hover:text-[#edf3ef]"}`}>
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#c9f27b]" : "text-[#71818e] group-hover:text-[#b3c2cc]"}`} strokeWidth={1.8} />
              <span className="flex-1 truncate sidebar-collapsed:hidden">{item.name}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-[#c9f27b] sidebar-collapsed:hidden" />}
              <span className={tooltip} aria-hidden="true">{item.name}</span>
            </Link>;
          })}</div>
        </div>)}
      </nav>

      <div className="space-y-2 border-t border-[#202a33] px-2.5 py-3 sidebar-collapsed:px-2">
        <div className="group relative flex items-center gap-2.5 rounded-lg border border-[#2c3838] bg-[#1a2423] px-2.5 py-2 sidebar-collapsed:flex-col sidebar-collapsed:gap-0 sidebar-collapsed:px-1 sidebar-collapsed:py-1.5">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#c9f27b] sidebar-collapsed:hidden" />
          <div className="min-w-0 sidebar-collapsed:hidden"><p className="text-[13px] font-semibold text-[#f2f7f0]">{days ?? "—"} <span className="font-normal text-[#9aa99e]">days to go</span></p><p className="truncate text-[10px] text-[#768a7b]">Target · {targetDate}</p></div>
          <span className="hidden text-sm font-semibold leading-5 text-[#f2f7f0] sidebar-collapsed:block">{days ?? "—"}</span>
          <span className="hidden text-[9px] uppercase tracking-wider text-[#8a9b8f] sidebar-collapsed:block">days</span>
          <span className={tooltip} aria-hidden="true">{days ?? "—"} days to go · {targetDate}</span>
        </div>
        <div className="group relative flex items-center gap-2.5 px-0.5 sidebar-collapsed:justify-center sidebar-collapsed:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#35463a] text-[11px] font-bold text-[#d4f4a2]">{initials || <User className="h-4 w-4" />}</div>
          <div className="min-w-0 flex-1 sidebar-collapsed:hidden"><p className="truncate text-[13px] font-semibold text-[#ecf1ee]">{profile?.name || "Your workspace"}</p><p className="flex items-center gap-1 truncate text-[11px] text-[#82909a]"><Flame className="h-3 w-3 shrink-0 text-[#c9f27b]" /> {streak}</p></div>
          <span className={tooltip} aria-hidden="true">{profile?.name || "Your workspace"} · {streak}</span>
        </div>
      </div>
    </aside>
  </>;
}
