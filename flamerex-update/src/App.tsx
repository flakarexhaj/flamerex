import { useEffect, useMemo, useState } from "react";
import StatCard from "./components/StatCard";
import Charts from "./components/Charts";
import EventTable from "./components/EventTable";
import EventDrawer from "./components/EventDrawer";
import ThreatMap from "./components/ThreatMap";
import Landing from "./components/Landing";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import { SeverityBadge, StatusText } from "./components/Badge";
import { SECTIONS, SECTION_INFO, readHash, type Section } from "./sections";
import { useStore } from "./store";

const panel = "rounded-2xl border border-violet-500/20 bg-slate-900/70";
const button =
  "rounded-xl border border-violet-500/25 bg-slate-900 px-4 py-2.5 text-sm font-medium transition-colors hover:border-violet-400/60 hover:bg-violet-500/10";

export default function App() {
  const [section, setSection] = useState<Section>(readHash);

  const events = useStore((s) => s.events);
  const live = useStore((s) => s.live);
  const addEvent = useStore((s) => s.addEvent);
  const select = useStore((s) => s.select);
  const toggleLive = useStore((s) => s.toggleLive);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(addEvent, 4000);
    return () => window.clearInterval(id);
  }, [live, addEvent]);

  // One section at a time. The URL hash keeps the back button and shared links working.
  useEffect(() => {
    const onHash = () => {
      setSection(readHash());
      select(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [select]);

  const go = (s: Section) => { window.location.hash = s; };

  const recent = useMemo(() => [...events].sort((a, b) => b.time - a.time).slice(0, 8), [events]);

  if (section === "home") return <Landing onNavigate={go} />;

  const dayAgo = Date.now() - 86400_000;
  const last24 = events.filter((e) => e.time > dayAgo).length;
  const critical = events.filter((e) => e.severity === "critical" && e.status !== "resolved").length;
  const open = events.filter((e) => e.status === "open").length;
  const resolvedPct = events.length
    ? Math.round((events.filter((e) => e.status === "resolved").length / events.length) * 100)
    : 0;

  const info = SECTION_INFO[section];

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-violet-500/15 bg-slate-950/80 p-5 backdrop-blur-xl md:flex">
          <button onClick={() => go("home")} className="mb-10 flex items-center gap-3 rounded-xl p-2 text-left" aria-label="FLAMEREX home">
            <span className="font-display text-3xl italic leading-none text-white">FR</span>
            <span>
              <span className="block text-base font-semibold tracking-[0.2em] text-violet-200">FLAMEREX</span>
              <span className="block text-[9px] tracking-[0.22em] text-slate-400">SECURITY SYSTEMS</span>
            </span>
          </button>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          <nav className="space-y-2" aria-label="Sections">
            {SECTIONS.map((id) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={id === section ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                  id === section
                    ? "border-violet-400/40 bg-violet-500/15 font-semibold text-violet-100"
                    : "border-transparent text-slate-400 hover:border-violet-500/25 hover:bg-violet-500/10"
                }`}
              >
                <span className="w-6 text-center text-lg text-violet-400">{SECTION_INFO[id].symbol}</span>
                {SECTION_INFO[id].label}
              </button>
            ))}
          </nav>

          <div className={`mt-auto p-4 ${panel}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-500"}`} />
              <span className="text-xs font-semibold">{live ? "Monitoring active" : "Monitoring paused"}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">Demo environment with simulated data.</p>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Mobile section tabs */}
            <nav className="flex gap-2 overflow-x-auto md:hidden" aria-label="Sections">
              {SECTIONS.map((id) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  aria-current={id === section ? "page" : undefined}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${
                    id === section ? "border-violet-400/40 bg-violet-500/15 font-semibold text-violet-100" : "border-violet-500/20 text-slate-400"
                  }`}
                >
                  {SECTION_INFO[id].label}
                </button>
              ))}
            </nav>

            <header className={`p-5 sm:p-6 ${panel}`}>
              <button onClick={() => go("home")} className="mb-4 text-sm text-violet-300 transition-colors hover:text-white">
                ← Back to home
              </button>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{info.title}</h1>
                  <p className="mt-2 text-sm text-slate-400">{info.description}</p>
                </div>
                <button onClick={toggleLive} aria-pressed={live} className={`flex items-center gap-2 ${button}`}>
                  <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-500"}`} />
                  {live ? "Live monitoring" : "Paused"}
                </button>
              </div>
            </header>

            {section === "events" && <EventTable />}

            {section === "intelligence" && (
              <div className="space-y-5">
                <ThreatMap />
                <div className={`overflow-hidden ${panel}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-500/15 p-5">
                    <div>
                      <h2 className="font-semibold">Live Threat Feed</h2>
                      <p className="mt-1 text-xs text-slate-400">Most recent events recorded by this dashboard.</p>
                    </div>
                    <span className="text-xs text-slate-400">{events.length} events</span>
                  </div>
                  <ul className="divide-y divide-violet-500/10">
                    {recent.map((e) => (
                      <li key={e.id} className="grid grid-cols-1 gap-2 p-4 transition-colors hover:bg-violet-500/5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{e.type}</p>
                          <p className="mt-1 text-xs text-slate-400">{e.ip} · {e.country}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <SeverityBadge value={e.severity} />
                          <StatusText value={e.status} />
                        </div>
                        <time className="text-xs text-slate-500 sm:text-right">
                          {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {section === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Events, last 24h" value={last24} hint="All severities" />
                  <StatCard label="Unresolved critical" value={critical} hint="Needs immediate attention" tone="danger" />
                  <StatCard label="Open events" value={open} hint="Not yet triaged" />
                  <StatCard label="Resolved" value={`${resolvedPct}%`} hint="Share of all events" />
                </div>
                <Charts events={events} />
              </div>
            )}

            {section === "about" && <AboutSection />}
            {section === "contact" && <ContactSection />}

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-violet-500/10 py-4 text-xs text-slate-500">
              <span>FLAMEREX SECURITY · Portfolio project</span>
              <span>{events.length} demo events loaded</span>
            </footer>
          </div>
        </main>
      </div>
      <EventDrawer />
    </div>
  );
}
