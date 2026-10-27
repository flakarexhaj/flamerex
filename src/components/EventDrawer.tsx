import { useEffect } from "react";
import type { Status } from "../types";
import { useStore } from "../store";
import { SeverityBadge, StatusText } from "./Badge";

const STATUSES: Status[] = ["open", "investigating", "resolved"];

export default function EventDrawer() {
  const event = useStore((s) => s.events.find((e) => e.id === s.selectedId) ?? null);
  const select = useStore((s) => s.select);
  const onStatusChange = useStore((s) => s.updateStatus);
  const onClose = () => select(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  if (!event) return null;

  const rows: [string, string][] = [
    ["Attack type", event.type],
    ["Source IP", event.ip],
    ["Country", event.country],
    ["Target", event.target],
    ["Detected", new Date(event.time).toLocaleString("en")],
    ["Event ID", `#${event.id}`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-label="Event details"
        className="relative h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{event.type}</h2>
            <div className="mt-2 flex items-center gap-3">
              <SeverityBadge value={event.severity} />
              <StatusText value={event.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <dl className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between py-3">
              <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="font-mono">{value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Update status</h3>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(event.id, s)}
              aria-pressed={event.status === s}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                event.status === s
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}