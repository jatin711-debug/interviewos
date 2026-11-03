"use client";

import { useState } from "react";
import { ChevronDown, FileCode2, ListChecks, Table2 } from "lucide-react";
import { sqlCheckNames, tableDdl, type SqlChallenge, type SqlColumn, type SqlTable, type SqlValue } from "@/lib/sql-challenge";

const isNumeric = (type: string) => /^(INTEGER|REAL|NUMERIC)\b/i.test(type);

/** "INTEGER REFERENCES departments(id)" -> "integer → departments.id"; nullable columns say so. */
function describeType(type: string): string {
  const base = type.split(/\s+/)[0].toLowerCase();
  const reference = type.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i);
  if (/PRIMARY KEY/i.test(type)) return `${base} · primary key`;
  const parts = [base];
  if (reference) parts.push(`→ ${reference[1]}.${reference[2]}`);
  if (!/NOT NULL/i.test(type)) parts.push("nullable");
  return parts.join(" · ");
}

function Value({ value }: { value: SqlValue }) {
  if (value === null) return <span className="italic text-[#6c8277]">NULL</span>;
  return <>{value}</>;
}

function SampleTable({ table, rows }: { table: SqlTable; rows: SqlValue[][] }) {
  const columns: SqlColumn[] = table.columns;
  // Wide tables take more of the row; narrow ones pair up beside them on wide screens.
  return <div className="min-w-0 overflow-hidden rounded-xl border border-[#29363c] bg-[#0f181b]" style={{ flex: `${columns.length} 1 ${Math.min(columns.length * 7.5, 46)}rem` }}>
    <div className="flex items-center justify-between gap-3 border-b border-[#29363c] bg-[#131f24] px-4 py-2.5">
      <p className="flex items-center gap-2 font-mono text-[13px] font-semibold text-[#e2eee4]"><Table2 className="h-4 w-4 text-[#b7db98]" />{table.name}</p>
      <span className="text-[11px] text-[#7f948a]">{rows.length} {rows.length === 1 ? "row" : "rows"}</span>
    </div>
    <div className="max-h-72 overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-[#16242a]">
          <tr>{columns.map(([name, type]) => <th key={name} scope="col" className={`whitespace-nowrap px-3 py-2 align-bottom font-normal ${isNumeric(type) ? "text-right" : ""}`}>
            <span className="block font-mono text-[12px] font-semibold text-[#d7eec7]">{name}</span>
            <span className="block text-[10px] text-[#7f948a]">{describeType(type)}</span>
          </th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#1e2b2f]">
          {rows.map((row, index) => <tr key={index} className="hover:bg-[#142127]">{row.map((value, column) => <td key={column} className={`whitespace-nowrap px-3 py-1.5 font-mono text-[12px] text-[#c3d3c5] ${isNumeric(columns[column][1]) ? "text-right tabular-nums" : ""}`}><Value value={value} /></td>)}</tr>)}
          {!rows.length && <tr><td colSpan={columns.length} className="px-3 py-3 text-[12px] italic text-[#7f948a]">Empty in the sample data</td></tr>}
        </tbody>
      </table>
    </div>
  </div>;
}

/** The challenge's tables with the first dataset's rows, the CREATE TABLE statements, and what the checks cover. */
export function SqlSchemaView({ challenge }: { challenge: SqlChallenge }) {
  const [ddlOpen, setDdlOpen] = useState(false);
  const sample = challenge.datasets[0];
  const checks = sqlCheckNames(challenge);
  return <section className="rounded-2xl border border-[#29363c] bg-[#141e23] p-5 sm:p-6" aria-label="Schema and sample data">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-[#e2eee4]">Schema & sample data</h3>
        <p className="mt-1 text-xs leading-5 text-[#81958b]">The first check runs on exactly these rows. The others use hidden datasets built around edge cases.</p>
      </div>
      <button onClick={() => setDdlOpen(open => !open)} aria-expanded={ddlOpen} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-3 py-2 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b]"><FileCode2 className="h-3.5 w-3.5" />{ddlOpen ? "Hide" : "Show"} CREATE TABLE<ChevronDown className={`h-3.5 w-3.5 transition ${ddlOpen ? "rotate-180" : ""}`} /></button>
    </div>
    {ddlOpen && <pre className="mt-4 overflow-x-auto rounded-lg border border-[#2b3a35] bg-[#1e1e1e] p-4 font-mono text-[12.5px] leading-5 text-[#d4d4d4]">{challenge.tables.map(tableDdl).join("\n\n")}</pre>}
    <div className="mt-4 flex flex-wrap gap-4">
      {challenge.tables.map(table => <SampleTable key={table.name} table={table} rows={sample.rows[table.name] ?? []} />)}
    </div>
    <div className="mt-5 border-t border-[#29363c] pt-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8da99a]"><ListChecks className="h-3.5 w-3.5" />{checks.length} checks</p>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">{checks.map((name, index) => <li key={name} className="rounded-md border border-[#2c3d37] bg-[#111b1d] px-2.5 py-1 text-[11.5px] leading-4 text-[#aebfb5]">{name}{index === 0 && challenge.kind === "query" ? " (rows above)" : ""}</li>)}</ul>
    </div>
  </section>;
}
