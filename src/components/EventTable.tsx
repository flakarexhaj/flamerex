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
      <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">
        {new Date(c.getValue()).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </span>
    ),
  }),
  col.accessor("type", {
    header: "Attack",
    enableSorting: false,
    cell: (c) => <span className="font-medium">{c.getValue()}</span>,
  }),
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
  col.accessor("target", {
    header: "Target",
    enableSorting: false,
    cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>,
  }),
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

export default function EventTable() {
  const events = useStore((s) => s.events);
  const select = useStore((s) => s.select);
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: true }]);
  const [search, setSearch] = useState("");

  const table = useReactTable<SecurityEvent>({
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
    <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mr-auto text-sm font-semibold">
          Event log <span className="font-normal text-slate-500">({table.getFilteredRowModel().rows.length})</span>
        </h2>
        <input
          aria-label="Search events" placeholder="Search IP, type, country…" value={search}
          onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
          className="w-56 rounded-md border border-slate-300 bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-slate-700"
        />
        <select
          aria-label="Filter by severity" value={severity}
          onChange={(e) => {
            const v = e.target.value;
            table.getColumn("severity")?.setFilterValue(v === "all" ? undefined : v);
            table.setPageIndex(0);
          }}
          className="rounded-md border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500 dark:text-slate-400">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-200 dark:border-slate-800">
                {hg.headers.map((h) => {
                  const dir = h.column.getIsSorted();
                  const label = flexRender(h.column.columnDef.header, h.getContext());
                  return (
                    <th key={h.id} className="px-4 py-2 font-medium">
                      {h.column.getCanSort() ? (
                        <button onClick={h.column.getToggleSortingHandler()}>
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
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 focus-visible:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No events match. Clear the search or choose another severity.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-sm">
        <span className="text-slate-500">Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}</span>
        <div className="flex gap-2">
          <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700">Previous</button>
          <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700">Next</button>
        </div>
      </div>
    </section>
  );
}