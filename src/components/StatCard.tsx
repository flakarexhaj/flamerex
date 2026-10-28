interface Props { label: string; value: number | string; hint: string; tone?: "danger" | "default"; }

export default function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="border-t border-violet-500/15 pt-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-4xl font-semibold tabular-nums ${tone === "danger" ? "text-red-400" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
