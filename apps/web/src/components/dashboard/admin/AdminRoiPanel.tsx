"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart2 } from "lucide-react";

interface TrainingLine {
  id: string;
  title: string;
}

interface RoiRow {
  user_id: string;
  user_name: string;
  training_cost: number;
  baseline_productivity: number;
  current_productivity: number;
  baseline_eval_score: number;
  current_eval_score: number;
  completed_items: number;
  total_items: number;
}

function delta(current: number, baseline: number) {
  return Math.round((current - baseline) * 10) / 10;
}

function DeltaBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
      <TrendingUp size={13} />+{value}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-1 text-red-500 font-medium">
      <TrendingDown size={13} />{value}
    </span>
  );
  return <span className="inline-flex items-center gap-1 text-gray-400"><Minus size={13} />0</span>;
}

function avg(rows: RoiRow[], key: keyof RoiRow) {
  if (!rows.length) return 0;
  return Math.round((rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length) * 10) / 10;
}

export default function AdminRoiPanel() {
  const [lines, setLines] = useState<TrainingLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [rows, setRows] = useState<RoiRow[]>([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingRoi, setLoadingRoi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/training/lines")
      .then((r) => r.json())
      .then((d) => {
        const list: TrainingLine[] = d.lines ?? [];
        setLines(list);
        if (list.length > 0) setSelectedLine(list[0].id);
      })
      .catch(() => setError("No se pudieron cargar las líneas"))
      .finally(() => setLoadingLines(false));
  }, []);

  useEffect(() => {
    if (!selectedLine) return;
    setLoadingRoi(true);
    setError(null);
    fetch(`/api/training/lines/${selectedLine}/roi`)
      .then((r) => r.json())
      .then((d) => setRows(d.roi ?? []))
      .catch(() => setError("No se pudo cargar el ROI"))
      .finally(() => setLoadingRoi(false));
  }, [selectedLine]);

  const avgProdDelta = avg(rows.map(r => ({ ...r, d: delta(r.current_productivity, r.baseline_productivity) })), "d" as keyof RoiRow);
  const avgEvalDelta = avg(rows.map(r => ({ ...r, d: delta(r.current_eval_score, r.baseline_eval_score) })), "d" as keyof RoiRow);
  const avgCompletion = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.total_items > 0 ? (r.completed_items / r.total_items) * 100 : 0), 0) / rows.length)
    : 0;
  const hasCost = rows.some((r) => r.training_cost > 0);

  if (loadingLines) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">ROI de Formación</h3>
          <p className="text-sm text-gray-500">Comparativa antes/después por línea de formación</p>
        </div>
        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:w-64"
        >
          {lines.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {loadingRoi ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={20} />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <BarChart2 size={32} className="text-gray-300" />
          <p className="text-sm text-gray-500">Sin datos para esta línea.<br />Los datos aparecen cuando hay usuarios inscritos con snapshots capturados.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Productividad promedio</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{avg(rows, "current_productivity")}</span>
                <span className="mb-0.5 text-sm text-gray-400">/ 100</span>
                <span className="mb-0.5 ml-auto"><DeltaBadge value={avgProdDelta} /></span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Base: {avg(rows, "baseline_productivity")} → actual: {avg(rows, "current_productivity")}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Score de evaluaciones</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{avg(rows, "current_eval_score")}</span>
                <span className="mb-0.5 text-sm text-gray-400">/ 100</span>
                <span className="mb-0.5 ml-auto"><DeltaBadge value={avgEvalDelta} /></span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Base: {avg(rows, "baseline_eval_score")} → actual: {avg(rows, "current_eval_score")}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completitud promedio</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{avgCompletion}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${avgCompletion}%` }} />
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3 text-center">Productividad base</th>
                  <th className="px-4 py-3 text-center">Productividad actual</th>
                  <th className="px-4 py-3 text-center">Δ Prod.</th>
                  <th className="px-4 py-3 text-center">Eval base</th>
                  <th className="px-4 py-3 text-center">Eval actual</th>
                  <th className="px-4 py-3 text-center">Δ Eval</th>
                  <th className="px-4 py-3 text-center">Avance</th>
                  {hasCost && <th className="px-4 py-3 text-center">Costo</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => {
                  const prodDelta = delta(r.current_productivity, r.baseline_productivity);
                  const evalDelta = delta(r.current_eval_score, r.baseline_eval_score);
                  const completion = r.total_items > 0 ? Math.round((r.completed_items / r.total_items) * 100) : 0;
                  return (
                    <tr key={r.user_id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.user_name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{r.baseline_productivity}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">{r.current_productivity}</td>
                      <td className="px-4 py-3 text-center"><DeltaBadge value={prodDelta} /></td>
                      <td className="px-4 py-3 text-center text-gray-600">{r.baseline_eval_score}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">{r.current_eval_score}</td>
                      <td className="px-4 py-3 text-center"><DeltaBadge value={evalDelta} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${completion}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{completion}%</span>
                        </div>
                      </td>
                      {hasCost && (
                        <td className="px-4 py-3 text-center text-gray-600">
                          {r.training_cost > 0 ? `$${r.training_cost.toLocaleString()}` : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
