import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import type { SecurityEvent } from "../types";
import { ATTACK_TYPES } from "../data";

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <h2 className="mb-3 text-sm font-semibold">{title}</h2>
    <div className="h-56">{children}</div>
  </section>
);

const tooltipStyle = { background: "#0f172a", border: "none", borderRadius: 6, color: "#f1f5f9", fontSize: 12 };

export default function Charts({ events }: { events: SecurityEvent[] }) {
  const daily = useMemo(() => {
    const days = 14, start = new Date(); start.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() - (days - 1 - i) * 86400_000);
      return { day: d.toLocaleDateString("en", { month: "short", day: "numeric" }), t: d.getTime(), count: 0 };
    });
    events.forEach((e) => {
      const b = [...buckets].reverse().find((x) => e.time >= x.t);
      if (b) b.count++;
    });
    return buckets;
  }, [events]);

  const byType = useMemo(
    () => ATTACK_TYPES.map((t) => ({ type: t, count: events.filter((e) => e.type === t).length })).sort((a, b) => b.count - a.count),
    [events]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Panel title="Events over the last 14 days">
          <ResponsiveContainer>
            <AreaChart data={daily} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.4} /><stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Events" stroke="#0d9488" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="lg:col-span-2">
        <Panel title="Events by attack type">
          <ResponsiveContainer>
            <BarChart data={byType} layout="vertical" margin={{ left: 10, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#64748b22" }} />
              <Bar dataKey="count" name="Events" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
