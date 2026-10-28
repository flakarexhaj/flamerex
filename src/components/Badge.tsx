import type { Severity, Status } from "../types";

const SEV_DOT: Record<Severity, string> = { critical: "bg-red-500", high: "bg-orange-400", medium: "bg-amber-300", low: "bg-slate-400" };
const SEV_TEXT: Record<Severity, string> = { critical: "text-red-400", high: "text-orange-300", medium: "text-amber-200", low: "text-slate-300" };
const STA: Record<Status, string> = { open: "text-red-400", investigating: "text-amber-300", resolved: "text-emerald-400" };

export const SeverityBadge = ({ value }: { value: Severity }) => (
  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${SEV_TEXT[value]}`}>
    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${SEV_DOT[value]}`} />
    {value}
  </span>
);

export const StatusText = ({ value }: { value: Status }) => (
  <span className={`text-sm font-medium ${STA[value]}`}>{value}</span>
);
