import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import type { SecurityEvent } from "../types";
import { ATTACK_TYPES } from "../data";

const GOLD = "#d4af57";
const TICK = { fontSize: 11, fill: "#9a8db8" };

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-violet-500/15 pt-4">
    <h2 className="mb-3 text-sm font-semibold">{title}</h2>
    <div className="h-56">{children}</div>
  </section>
);

const tooltipStyle = { background: "#170f29", border: `1px solid ${GOLD}66`, borderRadius: 6, color: "#f3eefc", fontSize: 12 };

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
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Panel title="Events over the last 14 days">
          <ResponsiveContainer>
            <AreaChart data={daily} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf626" vertical={false} />
              <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={false} interval={1} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Events" stroke={GOLD} strokeWidth={2} fill="url(#goldFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="lg:col-span-2">
        <Panel title="Events by attack type">
          <ResponsiveContainer>
            <BarChart data={byType} layout="vertical" margin={{ left: 10, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="type" width={90} tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#8b5cf622" }} />
              <Bar dataKey="count" name="Events" fill={GOLD} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
