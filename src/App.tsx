import { useCallback, useEffect, useState } from "react";
import type { SecurityEvent, Status } from "./types";
import { makeEvent, seedEvents } from "./data";
import StatCard from "./components/StatCard";
import Charts from "./components/Charts";
import EventTable from "./components/EventTable";
import EventDrawer from "./components/EventDrawer";

export default function App() {
  const [events, setEvents] = useState<SecurityEvent[]>(() => seedEvents());
  const [live, setLive] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
const selected = events.find((e) => e.id === selectedId) ?? null;
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  // Simulated live feed: a new event arrives every 4 seconds
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setEvents((prev) => [makeEvent(Date.now()), ...prev]), 4000);
    return () => clearInterval(id);
  }, [live]);

  const updateStatus = useCallback((id: number, status: Status) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  const dayAgo = Date.now() - 86400_000;
  const last24 = events.filter((e) => e.time > dayAgo).length;
  const critical = events.filter((e) => e.severity === "critical" && e.status !== "resolved").length;
  const open = events.filter((e) => e.status === "open").length;
  const resolvedPct = Math.round((events.filter((e) => e.status === "resolved").length / events.length) * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sentinel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Security operations overview (demo data)</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setLive(!live)} aria-pressed={live} className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700">
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
            {live ? "Live" : "Paused"}
          </button>
          <button onClick={() => setDark(!dark)} className="rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700">{dark ? "Light mode" : "Dark mode"}</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Events, last 24h" value={last24} hint="All severities" />
        <StatCard label="Unresolved critical" value={critical} hint="Needs immediate attention" tone="danger" />
        <StatCard label="Open events" value={open} hint="Not yet triaged" />
        <StatCard label="Resolved" value={`${resolvedPct}%`} hint="Share of all events" />
      </div>

      <Charts events={events} />
      <EventTable events={events} onStatusChange={updateStatus} onSelect={(e) => setSelectedId(e.id)} />
<EventDrawer event={selected} onClose={() => setSelectedId(null)} onStatusChange={updateStatus} />
    </div>
  );
}
