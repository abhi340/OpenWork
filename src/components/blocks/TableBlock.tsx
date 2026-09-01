"use client";

import React, { useState } from "react";
import { Plus, Trash2, PlusCircle, Download, Search } from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";

export function TableBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  const [newColName, setNewColName] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const columns: string[] = block.config?.columns || ["Task / Lead", "Owner", "Status"];
  const rows: Record<string, string>[] = block.items || [
    { "Task / Lead": "Outreach to TechCorp", Owner: "Abhi", Status: "Sent" }
  ];

  const handleCellChange = (rowIndex: number, col: string, value: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [col]: value };
    updateBlock(block.id, { items: updatedRows });
  };

  const addRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRow: Record<string, string> = {};
    columns.forEach((c) => (newRow[c] = ""));
    updateBlock(block.id, { items: [...rows, newRow] });
  };

  const removeRow = (rowIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedRows = rows.filter((_, idx) => idx !== rowIndex);
    updateBlock(block.id, { items: updatedRows });
  };

  const addColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const colTrimmed = newColName.trim();
    if (columns.includes(colTrimmed)) return;

    const newColumns = [...columns, colTrimmed];
    updateBlock(block.id, {
      config: { ...block.config, columns: newColumns }
    });
    setNewColName("");
    setShowAddCol(false);
  };

  const removeColumn = (colName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (columns.length <= 1) return;
    const newColumns = columns.filter((c) => c !== colName);
    updateBlock(block.id, {
      config: { ...block.config, columns: newColumns }
    });
  };

  const exportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rows.length === 0) return;
    const headers = columns.join(",");
    const csvRows = rows.map((r) =>
      columns.map((c) => `"${(r[c] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(block.title || "table_export").toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter rows based on search
  const filteredRows = searchQuery.trim()
    ? rows.filter((r) =>
        columns.some((c) => (r[c] || "").toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : rows;

  return (
    <div className="mt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {/* Table Header Bar with Search & Export */}
      {rows.length > 2 && (
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${rows.length} rows...`}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={exportCSV}
            className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download records as CSV spreadsheet"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400">
              {columns.map((col, idx) => (
                <th key={idx} className="py-2.5 px-3 font-semibold tracking-wider group relative">
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    {columns.length > 1 && (
                      <button
                        onClick={(e) => removeColumn(col, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-1"
                        title="Delete Column"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-2 w-10 text-right">
                <button
                  onClick={() => setShowAddCol(!showAddCol)}
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                  title="Add Column"
                >
                  <PlusCircle size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredRows.map((row, rIdx) => {
              const originalIndex = rows.indexOf(row);
              return (
                <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 group transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-1 px-2.5">
                      <input
                        type="text"
                        value={row[col] || ""}
                        onChange={(e) => handleCellChange(originalIndex, col, e.target.value)}
                        placeholder="Empty..."
                        className="w-full bg-transparent text-slate-800 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-700 focus:outline-none focus:bg-slate-100 dark:focus:bg-zinc-800/80 px-2 py-1.5 rounded text-xs"
                      />
                    </td>
                  ))}
                  <td className="py-1 px-2 text-right">
                    <button
                      onClick={(e) => removeRow(originalIndex, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                      title="Delete Row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-6 text-center text-slate-400 dark:text-zinc-600 text-xs">
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 font-medium flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <Plus size={13} /> Add Row
          </button>

          {rows.length <= 2 && rows.length > 0 && (
            <button
              onClick={exportCSV}
              className="text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 text-xs flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Download records as CSV"
            >
              <Download size={11} />
              <span>CSV</span>
            </button>
          )}
        </div>

        {showAddCol && (
          <form onSubmit={addColumn} className="flex items-center gap-1.5">
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="Column name..."
              autoFocus
              className="bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddCol(false)}
              className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-zinc-400 text-xs"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
