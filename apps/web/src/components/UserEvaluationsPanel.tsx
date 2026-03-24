"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  Target,
} from "lucide-react";
import EvaluationFormModal from "./dashboard/EvaluationFormModal";
import { finishEvaluation, startEvaluation } from "@/services/formServicesApi";

type EvaluationStatus = 0 | 1 | 2 | 3;

interface EvaluationDetails {
  instructions?: string;
  durationMinutes?: number;
  passingScore?: number;
  type?: string;
}

interface UserEvaluation {
  id: string;
  title: string;
  description?: string;
  status?: EvaluationStatus | null;
  assigned_date?: string;
  due_date?: string;
  started_at?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  max_score?: number | null;
  details?: EvaluationDetails | string | null;
  assigned_by_name?: string | null;
  google_form_id?: string | null;
}

function parseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
}

function parseDetails(
  details: UserEvaluation["details"]
): EvaluationDetails {
  return parseJson<EvaluationDetails>(details, {});
}

function normalizeStatus(status?: number | null): EvaluationStatus {
  if (status === 0 || status === 1 || status === 2 || status === 3) {
    return status;
  }

  return 0;
}

function getStatusConfig(status: EvaluationStatus) {
  switch (status) {
    case 0:
      return {
        label: "Pendiente",
        icon: AlertCircle,
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    case 1:
      return {
        label: "Disponible",
        icon: ClipboardCheck,
        badge: "bg-violet-100 text-violet-700 border-violet-200",
        dot: "bg-violet-500",
      };
    case 2:
      return {
        label: "En progreso",
        icon: PlayCircle,
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case 3:
      return {
        label: "Completada",
        icon: CheckCircle2,
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    default:
      return {
        label: "Pendiente",
        icon: AlertCircle,
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        dot: "bg-gray-400",
      };
  }
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

export default function UserEvaluationsPanel() {
  const [evaluations, setEvaluations] = useState<UserEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeGoogleFormId, setActiveGoogleFormId] = useState<string | null>(null);
  const [activeGoogleFormTitle, setActiveGoogleFormTitle] = useState<string>("");

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/user/evaluations", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error loading evaluations");
      }

      const incomingEvaluations: UserEvaluation[] = data.evaluations || [];
      setEvaluations(incomingEvaluations);

      if (incomingEvaluations.length > 0) {
        setSelectedEvaluationId((prevSelectedId) => {
          if (!prevSelectedId) return incomingEvaluations[0].id;

          const exists = incomingEvaluations.some(
            (evaluation) => evaluation.id === prevSelectedId
          );

          return exists ? prevSelectedId : incomingEvaluations[0].id;
        });
      } else {
        setSelectedEvaluationId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading evaluations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleForm = async () => {
    if (!selectedEvaluation?.google_form_id || !selectedEvaluationId) {
      alert("Esta evaluación no tiene un Google Form configurado");
      return;
    }

    try {
      setStarting(true);

      const success = await startEvaluation(selectedEvaluationId);

      if (success) {
        await fetchEvaluations();
        setActiveGoogleFormId(selectedEvaluation.google_form_id);
        setActiveGoogleFormTitle(selectedEvaluation.title || "Evaluación");
        setIsFormModalOpen(true);
      } else {
        alert("No se pudo iniciar la evaluación. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Ocurrió un error al conectar con el servidor.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const selectedEvaluation = useMemo(
    () =>
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ||
      null,
    [evaluations, selectedEvaluationId]
  );

  const stats = useMemo(() => {
    const normalized = evaluations.map((evaluation) =>
      normalizeStatus(evaluation.status)
    );

    return {
      pending: normalized.filter((s) => s === 0 || s === 1).length,
      inProgress: normalized.filter((s) => s === 2).length,
      completed: normalized.filter((s) => s === 3).length,
    };
  }, [evaluations]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100" />
              ))}
            </div>
            <div className="h-[420px] rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Mis evaluaciones
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Inicia y consulta tus evaluaciones asignadas.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-medium text-amber-700">Pendientes</p>
                <p className="mt-1 text-xl font-bold text-amber-900">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium text-blue-700">En progreso</p>
                <p className="mt-1 text-xl font-bold text-blue-900">
                  {stats.inProgress}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">Completadas</p>
                <p className="mt-1 text-xl font-bold text-emerald-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">
                  Lista de evaluaciones
                </h3>
              </div>

              {evaluations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                  No tienes evaluaciones asignadas todavía.
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluations.map((evaluation) => {
                    const status = normalizeStatus(evaluation.status);
                    const statusConfig = getStatusConfig(status);
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedEvaluationId === evaluation.id;

                    return (
                      <button
                        key={evaluation.id}
                        type="button"
                        onClick={() => setSelectedEvaluationId(evaluation.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-green-300 bg-white shadow-sm ring-2 ring-green-500/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {evaluation.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {evaluation.description || "Sin descripción"}
                            </p>
                          </div>

                          <ChevronRight
                            size={18}
                            className={isSelected ? "text-green-600" : "text-gray-400"}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.badge}`}
                          >
                            <StatusIcon size={14} />
                            {statusConfig.label}
                          </span>

                          <span className="text-xs font-medium text-gray-500">
                            {evaluation.score != null && evaluation.max_score != null
                              ? `${evaluation.score}/${evaluation.max_score}`
                              : evaluation.score != null
                                ? `${evaluation.score}`
                                : "Sin resultado"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              {!selectedEvaluation ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
                  Selecciona una evaluación para ver sus detalles.
                </div>
              ) : (
                (() => {
                  const details = parseDetails(selectedEvaluation.details);
                  const normalizedStatus = normalizeStatus(selectedEvaluation.status);
                  const statusConfig = getStatusConfig(normalizedStatus);
                  const StatusIcon = statusConfig.icon;
                  const canStart = normalizedStatus === 0 || normalizedStatus === 1;

                  return (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-5">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot}`} />
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.badge}`}
                            >
                              <StatusIcon size={14} />
                              {statusConfig.label}
                            </span>
                          </div>

                          <h3 className="text-2xl font-semibold text-gray-900">
                            {selectedEvaluation.title}
                          </h3>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                            {selectedEvaluation.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock3 size={16} className="text-violet-600" />
                            Duración
                          </div>
                          <p className="text-sm text-gray-900">
                            {details.durationMinutes
                              ? `${details.durationMinutes} min`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FileText size={16} className="text-amber-600" />
                            Tipo
                          </div>
                          <p className="text-sm capitalize text-gray-900">
                            {details.type || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Target size={16} className="text-blue-600" />
                            Puntaje mínimo
                          </div>
                          <p className="text-sm text-gray-900">
                            {details.passingScore ?? "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            Resultado
                          </div>
                          <p className="text-sm text-gray-900">
                            {selectedEvaluation.score != null &&
                            selectedEvaluation.max_score != null
                              ? `${selectedEvaluation.score}/${selectedEvaluation.max_score}`
                              : selectedEvaluation.score != null
                                ? `${selectedEvaluation.score}`
                                : "—"}
                          </p>
                        </div>
                      </div>

                      {details.instructions && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <h4 className="mb-2 font-medium text-gray-900">
                            Instrucciones
                          </h4>
                          <p className="text-sm leading-6 text-gray-600">
                            {details.instructions}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {canStart && (
                          <button
                            type="button"
                            onClick={handleOpenGoogleForm}
                            disabled={starting}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
                          >
                            {starting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <PlayCircle size={16} />
                            )}
                            {starting ? "Iniciando..." : "Iniciar evaluación"}
                          </button>
                        )}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Asignada
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(selectedEvaluation.assigned_date)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Fecha límite
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(selectedEvaluation.due_date)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Iniciada
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(selectedEvaluation.started_at)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Enviada
                            </p>
                            <p className="mt-1 text-sm text-gray-900">
                              {formatDate(selectedEvaluation.submitted_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      <EvaluationFormModal
        open={isFormModalOpen}
        onClose={async () => {
          try {
            console.log("esta por cerrar", selectedEvaluationId);

            if (selectedEvaluationId) {
              const success = await finishEvaluation(selectedEvaluationId);

              if (success) {
                await fetchEvaluations();
              }
            }
          } catch (error) {
            console.error("Error al finalizar evaluación:", error);
          } finally {
            setIsFormModalOpen(false);
            setActiveGoogleFormId(null);
            setActiveGoogleFormTitle("");
          }
        }}
        title={activeGoogleFormTitle}
        googleFormId={activeGoogleFormId}
      />
    </>
  );
}