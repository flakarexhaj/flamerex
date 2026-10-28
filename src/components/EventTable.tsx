import { useState } from "react";
import {
  createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  type FilterFn, type SortingState,
} from "@tanstack/react-table";
import type { SecurityEvent, Severity, Status } from "../types";
import { SEVERITIES, SEVERITY_RANK } from "../data";
import { useStore } from "../store";
import { SeverityBadge, StatusText } from "./Badge";

const NEXT: Record<Status, Status> = { open: "investigating", investigating: "resolved", resolved: "open" };
const col = createColumnHelper<SecurityEvent>();

const searchFilter: FilterFn<SecurityEvent> = (row, _columnId, value: string) => {
  const q = String(value).trim().toLowerCase();
  if (!q) return true;
  const e = row.original;
  return [e.ip, e.type, e.country, e.target].some((v) => v.toLowerCase().includes(q));
};

const columns = [
  col.accessor("time", {
    header: "Time",
    sortDescFirst: true,
    cell: (c) => (
      <span className="whitespace-nowrap text-slate-400">
        {new Date(c.getValue()).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </span>
    ),
  }),
  col.accessor("type", { header: "Attack", enableSorting: false, cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
  col.accessor("severity", {
    header: "Severity",
    filterFn: "equalsString",
    sortDescFirst: true,
    sortingFn: (a, b) => SEVERITY_RANK[a.original.severity] - SEVERITY_RANK[b.original.severity],
    cell: (c) => <SeverityBadge value={c.getValue()} />,
  }),
  col.accessor((e) => `${e.ip} ${e.country}`, {
    id: "source",
    header: "Source",
    enableSorting: false,
    cell: (c) => (
      <>
        <span className="font-mono text-xs">{c.row.original.ip}</span>{" "}
        <span className="text-slate-500">{c.row.original.country}</span>
      </>
    ),
  }),
  col.accessor("target", { header: "Target", enableSorting: false, cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span> }),
  col.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: (c) => {
      const e = c.row.original;
      return (
        <button
          onClick={(ev) => { ev.stopPropagation(); useStore.getState().updateStatus(e.id, NEXT[e.status]); }}
          title={`Change to ${NEXT[e.status]}`}
          className="rounded focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <StatusText value={e.status} />
        </button>
      );
    },
  }),
];

const line = "border-violet-500/30 bg-transparent text-sm transition-colors focus:border-violet-400";

export default function EventTable() {
  const events = useStore((s) => s.events);
  const select = useStore((s) => s.select);
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: true }]);
  const [search, setSearch] = useState("");

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    globalFilterFn: searchFilter,
    autoResetPageIndex: false, // otherwise live events would send you back to page 1
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const severity = (table.getColumn("severity")?.getFilterValue() as Severity | undefined) ?? "all";
  const rows = table.getRowModel().rows;
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <section>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 pb-4">
        <h2 className="mr-auto text-sm font-semibold">
          Event log <span className="font-normal text-slate-500">({table.getFilteredRowModel().rows.length})</span>
        </h2>
        <input
          aria-label="Search events" placeholder="Search IP, type, country…" value={search}
          onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
          className={`w-56 border-0 border-b px-0 py-1.5 placeholder:text-slate-500 ${line}`}
        />
        <select
          aria-label="Filter by severity" value={severity}
          onChange={(e) => {
            const v = e.target.value;
            table.getColumn("severity")?.setFilterValue(v === "all" ? undefined : v);
            table.setPageIndex(0);
          }}
          className={`border-0 border-b py-1.5 pr-6 ${line}`}
        >
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto border-t border-violet-500/15">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-violet-500/15">
                {hg.headers.map((h) => {
                  const dir = h.column.getIsSorted();
                  const label = flexRender(h.column.columnDef.header, h.getContext());
                  return (
                    <th key={h.id} className="py-2.5 pr-4 font-medium">
                      {h.column.getCanSort() ? (
                        <button onClick={h.column.getToggleSortingHandler()} className="hover:text-white">
                          {label}{dir === "asc" ? " ↑" : dir === "desc" ? " ↓" : ""}
                        </button>
                      ) : label}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => select(row.original.id)}
                onKeyDown={(ev) => ev.key === "Enter" && select(row.original.id)}
                tabIndex={0}
                className="cursor-pointer border-b border-violet-500/10 transition-colors last:border-0 hover:bg-violet-500/5 focus-visible:bg-violet-500/5"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 pr-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-500">No events match. Clear the search or choose another severity.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-violet-500/15 py-3 text-sm">
        <span className="text-slate-500">Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}</span>
        <div className="flex gap-6">
          <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="transition-colors hover:text-white disabled:opacity-40 disabled:hover:text-inherit">← Previous</button>
          <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="transition-colors hover:text-white disabled:opacity-40 disabled:hover:text-inherit">Next →</button>
        </div>
      </div>
    </section>
  );
}
