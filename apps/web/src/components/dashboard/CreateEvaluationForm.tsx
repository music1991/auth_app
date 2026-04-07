"use client";

import { EvaluationType, NewEvaluationFormData } from "@/app/types/types";
import { extractGoogleFormId } from "@/lib/utils";



interface CreateEvaluationFormProps {
  open: boolean;
  newEvaluation: NewEvaluationFormData;
  submitting: boolean;
  onClose: () => void;
  onChange: (patch: Partial<NewEvaluationFormData>) => void;
  onSubmit: () => void;
}

export function CreateEvaluationForm({
  open,
  newEvaluation,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: CreateEvaluationFormProps) {
  if (!open) return null;

  const isFormInvalid =
    !newEvaluation.title ||
    (newEvaluation.online && !newEvaluation.google_form_id);

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">
        Configurar Evaluación
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Título</label>
          <input
            type="text"
            placeholder="Ej: Evaluación de Desempeño Q1"
            className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newEvaluation.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Categoría</label>
          <select
            className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newEvaluation.type}
            onChange={(e) => onChange({ type: e.target.value as EvaluationType })}
          >
            <option value="environment">Clima Laboral</option>
            <option value="performance">Desempeño</option>
            <option value="skills">Skills</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Descripción</label>
          <textarea
            placeholder="Breve descripción del objetivo..."
            className="border p-2.5 rounded-lg h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newEvaluation.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Maximo Puntaje</label>
          <input            
            type="number"
            placeholder="Puntaje máximo"
            className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newEvaluation.max_score}
            onChange={(e) => onChange({ max_score: Number(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Modalidad</label>
          <select
            className="border p-2.5 rounded-lg border-blue-300 bg-blue-50/30 focus:ring-2 focus:ring-blue-500 outline-none"
            value={newEvaluation.online ? "true" : "false"}
            onChange={(e) =>
              onChange({
                online: e.target.value === "true",
                google_form_id:
                  e.target.value === "true" ? newEvaluation.google_form_id : "",
              })
            }
          >
            <option value="false">📍 Presencial</option>
            <option value="true">🌐 Online (Google Forms)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 uppercase">Fecha Límite</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={newEvaluation.dueDate?.split("T")[0] || ""}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className="border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div
          className={`md:col-span-2 space-y-4 p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
            newEvaluation.online
              ? "border-blue-200 bg-blue-50/20 opacity-100"
              : "border-gray-100 bg-gray-50/50 opacity-50 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Configuración de Formulario
            </h4>

            {!newEvaluation.online && (
              <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">
                Deshabilitado
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                ID de Google Form
              </label>
              <input
                type="text"
                placeholder="Pegue la URL o el ID aquí..."
                disabled={!newEvaluation.online}
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={newEvaluation.google_form_id || ""}
                onChange={(e) =>
                  onChange({
                    google_form_id: extractGoogleFormId(e.target.value),
                  })
                }
              />
            </div>

            <a
              href={newEvaluation.online ? "https://forms.new" : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-2 px-4 py-2.5 font-bold text-white rounded-lg transition-all duration-200 ${
                newEvaluation.online
                  ? "bg-gray-900 hover:bg-black shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Nuevo Form</span>
            </a>
          </div>

          <p className="text-[10px] text-gray-500">
            {newEvaluation.online
              ? "Extraeremos automáticamente el ID desde el enlace que pegues."
              : "Cambia la modalidad a Online para usar esta función."}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t pt-6">
        <button
          onClick={onClose}
          className="text-gray-600 font-bold px-6 py-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting || isFormInvalid}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {submitting ? "Creando..." : "Crear Evaluación"}
        </button>
      </div>
    </div>
  );
}