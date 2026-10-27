interface Props { label: string; value: number | string; hint: string; tone?: "danger" | "default"; }

export default function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tone === "danger" ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
