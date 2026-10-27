import type { Severity, Status } from "../types";

const SEV: Record<Severity, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/40",
  medium: "bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/40",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/30",
};
const STA: Record<Status, string> = {
  open: "text-red-600 dark:text-red-400",
  investigating: "text-amber-600 dark:text-amber-400",
  resolved: "text-emerald-600 dark:text-emerald-400",
};

export const SeverityBadge = ({ value }: { value: Severity }) => (
  <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEV[value]}`}>{value}</span>
);
export const StatusText = ({ value }: { value: Status }) => (
  <span className={`text-sm font-medium ${STA[value]}`}>{value}</span>
);
