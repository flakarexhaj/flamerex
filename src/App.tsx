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
import { SECTION_INFO, readHash, type Section } from "./sections";
import { useStore } from "./store";

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
      <main className="mx-auto max-w-[1400px] space-y-10 p-4 sm:p-6 lg:p-8">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => go("home")} className="-ml-1 px-1 py-2 text-sm text-violet-300 transition-colors hover:text-white">
              ← Back to home
            </button>
            <button onClick={toggleLive} aria-pressed={live} className="flex items-center gap-2 px-1 py-2 text-sm text-slate-300 transition-colors hover:text-white">
              <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-500"}`} />
              {live ? "Live monitoring" : "Paused"}
            </button>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{info.title}</h1>
          <p className="mt-2 max-w-prose text-sm text-slate-400">{info.description}</p>
        </header>

        {section === "events" && <EventTable />}

            {section === "intelligence" && (
              <div className="space-y-10">
                <ThreatMap />
                <section>
                  <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
                    <div>
                      <h2 className="font-semibold">Live Threat Feed</h2>
                      <p className="mt-1 text-xs text-slate-400">Most recent events recorded by this dashboard.</p>
                    </div>
                    <span className="text-xs text-slate-400">{events.length} events</span>
                  </div>
                  <ul className="divide-y divide-violet-500/10 border-y border-violet-500/15">
                    {recent.map((e) => (
                      <li key={e.id} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{e.type}</p>
                          <p className="mt-1 text-xs text-slate-400">{e.ip} · {e.country}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <SeverityBadge value={e.severity} />
                          <StatusText value={e.status} />
                        </div>
                        <time className="text-xs text-slate-500 sm:text-right">
                          {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </time>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {section === "analytics" && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
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
      </main>
      <EventDrawer />
    </div>
  );
}
