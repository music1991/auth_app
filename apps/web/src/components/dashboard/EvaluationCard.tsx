"use client";

import { BarChart3 } from "lucide-react";

import { formatDateShort } from "@/lib/utils";

import { StatItem } from "./StatItem";
import { EVALUATION_TYPE_LABELS, MODE, TEMPLATE_STATUS_LABELS } from "@/lib/constants";
import { EvaluationTemplateItem } from "@/types";

interface EvaluationCardProps {
  evaluation: EvaluationTemplateItem;
  onPublish: (templateId: string) => void;
  onManageAssignments: (templateId: string, dueDate: string | null) => void;
  onViewResults: (templateId: string) => void;
}

export function EvaluationCard({
  evaluation,
  onPublish,
  onManageAssignments,
  onViewResults,
}: EvaluationCardProps) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            {EVALUATION_TYPE_LABELS[evaluation.type]}
          </span>

          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            {MODE[`${evaluation.online}`]}
          </span>

          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              evaluation.status === "active"
                ? "bg-green-50 text-green-600"
                : evaluation.status === "draft"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-yellow-50 text-yellow-600"
            }`}
          >
            {TEMPLATE_STATUS_LABELS[evaluation.status]}
          </span>
        </div>

        <h4 className="font-bold text-gray-900 mb-1">{evaluation.title}</h4>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{evaluation.description}</p>

        <p className="text-xs text-gray-500 line-clamp-2 mb-4">
          Fecha limite: {formatDateShort(evaluation.dueDate!)}
        </p>

        <div className="flex justify-between border-t border-gray-50 pt-3 mb-4 text-center">
          <StatItem label="Asignados" value={evaluation.assignedUsers} />
        </div>
      </div>

      <div className="flex gap-2">
        {evaluation.status === "draft" && (
          <button
            onClick={() => onPublish(evaluation.id)}
            className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-500"
          >
            Publicar
          </button>
        )}

        <button
          onClick={() => onManageAssignments(evaluation.id, evaluation.dueDate)}
          className="flex-1 border text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50"
        >
          Gestionar asignaciones
        </button>

        <button
          onClick={() => onViewResults(evaluation.id)}
          className="flex-1 flex items-center justify-center gap-1 border text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50"
        >
          <BarChart3 size={13} />
          Ver resultados
        </button>
      </div>
    </div>
  );
}