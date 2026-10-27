import { useMemo, useState } from "react";
import type { SecurityEvent, Severity, Status } from "../types";
import { SEVERITIES, SEVERITY_RANK } from "../data";
import { SeverityBadge, StatusText } from "./Badge";

type SortKey = "time" | "severity";
const PAGE_SIZE = 10;
const NEXT: Record<Status, Status> = { open: "investigating", investigating: "resolved", resolved: "open" };

interface Props { events: SecurityEvent[]; onStatusChange: (id: number, status: Status) => void; }

export default function EventTable({ events, onStatusChange }: Props) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "time", dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => (severity === "all" || e.severity === severity) &&
        (!q || [e.ip, e.type, e.country, e.target].some((v) => v.toLowerCase().includes(q))))
      .sort((a, b) => sort.dir * (sort.key === "time" ? a.time - b.time : SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]));
  }, [events, query, severity, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");

  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mr-auto text-sm font-semibold">Event log <span className="font-normal text-slate-500">({rows.length})</span></h2>
        <input
          aria-label="Search events" placeholder="Search IP, type, country…" value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          className="w-56 rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-slate-700"
        />
        <select
          aria-label="Filter by severity" value={severity}
          onChange={(e) => { setSeverity(e.target.value as Severity | "all"); setPage(0); }}
          className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-2 font-medium"><button onClick={() => toggleSort("time")}>Time{arrow("time")}</button></th>
              <th className="px-4 py-2 font-medium">Attack</th>
              <th className="px-4 py-2 font-medium"><button onClick={() => toggleSort("severity")}>Severity{arrow("severity")}</button></th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Target</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{new Date(e.time).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-4 py-2.5 font-medium">{e.type}</td>
                <td className="px-4 py-2.5"><SeverityBadge value={e.severity} /></td>
                <td className="px-4 py-2.5"><span className="font-mono text-xs">{e.ip}</span> <span className="text-slate-500">{e.country}</span></td>
                <td className="px-4 py-2.5 font-mono text-xs">{e.target}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => onStatusChange(e.id, NEXT[e.status])} title={`Change to ${NEXT[e.status]}`} className="rounded focus-visible:ring-2 focus-visible:ring-teal-600">
                    <StatusText value={e.status} />
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No events match. Clear the search or choose another severity.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-sm">
        <span className="text-slate-500">Page {current + 1} of {pages}</span>
        <div className="flex gap-2">
          <button disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700">Previous</button>
          <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700">Next</button>
        </div>
      </div>
    </section>
  );
}
