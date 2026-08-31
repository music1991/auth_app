"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";

import { formatDateShort, isEvaluationExpired } from "@/lib/utils";
import { StatItem } from "../StatItem";
import {
  EvaluationAssignmentStatus,
  EvaluationResultRow,
  EvaluationTemplateItem,
} from "@/types";

interface EvaluationResultsViewProps {
  templates: EvaluationTemplateItem[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  results: EvaluationResultRow[];
  loading: boolean;
}

type ResultStatus = EvaluationAssignmentStatus;

const STATUS_CONFIG: Record<ResultStatus, { label: string; icon: typeof AlertCircle; badge: string }> = {
  pending: {
    label: "Pendiente",
    icon: AlertCircle,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  in_progress: {
    label: "En curso",
    icon: PlayCircle,
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completada",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  expired: {
    label: "Vencida",
    icon: AlertCircle,
    badge: "bg-red-100 text-red-700 border-red-200",
  },
};

function getResultStatus(row: EvaluationResultRow): ResultStatus {
  const isExpired = isEvaluationExpired(row.dueDate) && row.status !== "completed";
  return isExpired ? "expired" : row.status;
}

function formatScore(row: EvaluationResultRow): string {
  if (row.score != null && row.maxScore != null) return `${row.score}/${row.maxScore}`;
  return "—";
}

function formatResponseValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

function ResultStatusBadge({ status }: { status: ResultStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

function ResultsTableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 rounded-lg bg-gray-100" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 rounded-lg bg-gray-50" />
      ))}
    </div>
  );
}

export function EvaluationResultsView({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  results,
  loading,
}: EvaluationResultsViewProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = results.length;
    const completed = results.filter((r) => r.status === "completed").length;

    const graded = results.filter(
      (r) => r.score != null && r.maxScore != null && r.maxScore !== 0
    );
    let averageLabel = "—";
    if (graded.length > 0) {
      const avgScore = graded.reduce((sum, r) => sum + (r.score as number), 0) / graded.length;
      const avgMaxScore = graded.reduce((sum, r) => sum + (r.maxScore as number), 0) / graded.length;
      averageLabel = `${avgScore.toFixed(1)}/${avgMaxScore.toFixed(0)}`;
    }

    return {
      completedLabel: `${completed}/${total}`,
      averageLabel,
    };
  }, [results]);

  const toggleRow = (row: EvaluationResultRow) => {
    if (row.status !== "completed") return;
    setExpandedRowId((prev) => (prev === row.id ? null : row.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-800">Resultados</h2>
        <p className="text-sm text-gray-500">
          Auditá el estado real, la nota y las respuestas de cada usuario por plantilla.
        </p>
      </div>

      <div className="max-w-md">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Plantilla
        </label>
        <select
          value={selectedTemplateId ?? ""}
          onChange={(e) => onSelectTemplate(e.target.value)}
          className="w-full border border-gray-200 bg-white text-gray-800 rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
        >
          <option value="" disabled>
            Seleccioná una plantilla
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <ResultsTableSkeleton />
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-12 text-center text-sm text-gray-400">
          No hay usuarios asignados a esta plantilla
        </div>
      ) : (
        <>
          <div className="flex gap-8 border-t border-gray-100 pt-4">
            <StatItem label="Completados" value={stats.completedLabel} />
            <StatItem label="Promedio de nota" value={stats.averageLabel} />
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Fecha límite</th>
                  <th className="px-4 py-3">Completado</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => {
                  const status = getResultStatus(row);
                  const isCompleted = row.status === "completed";
                  const isExpanded = expandedRowId === row.id;
                  const responseEntries = row.responses ? Object.entries(row.responses) : [];

                  return (
                    <Fragment key={row.id}>
                      <tr
                        onClick={() => toggleRow(row)}
                        className={`border-b border-gray-50 last:border-b-0 ${
                          isCompleted ? "cursor-pointer hover:bg-gray-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {isCompleted &&
                              (isExpanded ? (
                                <ChevronDown size={14} className="shrink-0 text-gray-400" />
                              ) : (
                                <ChevronRight size={14} className="shrink-0 text-gray-400" />
                              ))}
                            <div>
                              <p className="font-semibold text-gray-900">{row.name}</p>
                              <p className="text-[11px] text-gray-500">{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ResultStatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{formatScore(row)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDateShort(row.dueDate)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDateShort(row.completedDate)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-gray-50 last:border-b-0 bg-gray-50/60">
                          <td colSpan={5} className="px-4 py-4">
                            {responseEntries.length === 0 ? (
                              <p className="text-xs text-gray-400">Sin respuestas registradas</p>
                            ) : (
                              <ul className="space-y-1.5 text-xs text-gray-600">
                                {responseEntries.map(([question, answer]) => (
                                  <li key={question}>
                                    <span className="font-semibold text-gray-800">{question}:</span>{" "}
                                    {formatResponseValue(answer)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

export default EvaluationResultsView;
