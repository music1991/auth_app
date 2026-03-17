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
  Send,
  Target,
} from "lucide-react";
import EvaluationFormModal from "./dashboard/EvaluationFormModal";

type EvaluationStatus =
  | "pending"
  | "available"
  | "in-progress"
  | "completed"
  | "submitted";

interface EvaluationQuestionOption {
  value: string;
  label: string;
}

interface EvaluationQuestion {
  id: string;
  question: string;
  type?: "text" | "textarea" | "multiple-choice" | "single-choice";
  required?: boolean;
  options?: EvaluationQuestionOption[];
  correctAnswer?: string;
  points?: number;
}

interface EvaluationDetails {
  instructions?: string;
  durationMinutes?: number;
  passingScore?: number;
  type?: string;
  questions?: EvaluationQuestion[];
}

interface UserEvaluation {
  id: string;
  title: string;
  description?: string;
  status?: EvaluationStatus;
  assigned_date?: string;
  due_date?: string;
  started_at?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  max_score?: number | null;
  details?: EvaluationDetails | string | null;
  questions?: EvaluationQuestion[] | string | null;
  assigned_by_name?: string | null;
  google_form_id?: string | null;
}

type ResponsesMap = Record<string, string>;

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

function parseQuestions(evaluation: UserEvaluation): EvaluationQuestion[] {
  const details = parseDetails(evaluation.details);

  if (details.questions?.length) return details.questions;

  return parseJson<EvaluationQuestion[]>(
    evaluation.questions,
    []
  );
}

function normalizeStatus(status?: string): EvaluationStatus {
  if (status === "completed" || status === "submitted") return "completed";
  if (status === "in-progress") return "in-progress";
  if (status === "available") return "available";
  return "pending";
}

function getStatusConfig(status: EvaluationStatus) {
  switch (status) {
    case "available":
      return {
        label: "Disponible",
        icon: ClipboardCheck,
        badge: "bg-violet-100 text-violet-700 border-violet-200",
        dot: "bg-violet-500",
      };
    case "pending":
      return {
        label: "Pendiente",
        icon: AlertCircle,
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    case "in-progress":
      return {
        label: "En progreso",
        icon: PlayCircle,
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "completed":
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

function buildInitialResponses(
  evaluation: UserEvaluation
): ResponsesMap {
  const questions = parseQuestions(evaluation);
  const initial: ResponsesMap = {};

  questions.forEach((question) => {
    initial[question.id] = "";
  });

  return initial;
}

export default function UserEvaluationsPanel() {
  const [evaluations, setEvaluations] = useState<UserEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [responses, setResponses] = useState<ResponsesMap>({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

const [isFormModalOpen, setIsFormModalOpen] = useState(false);
const [activeGoogleFormId, setActiveGoogleFormId] = useState<string | null>(null);
const [activeGoogleFormTitle, setActiveGoogleFormTitle] = useState<string>("");

const handleOpenGoogleForm = () => {
  if (!selectedEvaluation?.google_form_id) {
    alert("Esta evaluación no tiene un Google Form configurado");
    return;
  }

  setActiveGoogleFormId(selectedEvaluation.google_form_id);
  setActiveGoogleFormTitle(selectedEvaluation.title || "Evaluación");
  setIsFormModalOpen(true);
};

  useEffect(() => {
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
          setSelectedEvaluationId(incomingEvaluations[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error loading evaluations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const selectedEvaluation = useMemo(
    () =>
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ||
      null,
    [evaluations, selectedEvaluationId]
  );

  useEffect(() => {
    if (!selectedEvaluation) return;
    setResponses(buildInitialResponses(selectedEvaluation));
  }, [selectedEvaluation]);

  const questions = useMemo(
    () => (selectedEvaluation ? parseQuestions(selectedEvaluation) : []),
    [selectedEvaluation]
  );

  const stats = useMemo(() => {
    const normalized = evaluations.map((evaluation) =>
      normalizeStatus(evaluation.status)
    );

    return {
      pending: normalized.filter((s) => s === "pending" || s === "available")
        .length,
      inProgress: normalized.filter((s) => s === "in-progress").length,
      completed: normalized.filter((s) => s === "completed").length,
    };
  }, [evaluations]);

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    const answered = questions.filter((q) => {
      const value = responses[q.id];
      return typeof value === "string" && value.trim().length > 0;
    }).length;

    return Math.round((answered / questions.length) * 100);
  }, [questions, responses]);

  const scorePreview = useMemo(() => {
    if (!questions.length) return { score: 0, maxScore: 0 };

    let score = 0;
    let maxScore = 0;

    questions.forEach((question) => {
      const points = question.points ?? 1;
      maxScore += points;

      if (
        question.correctAnswer &&
        (responses[question.id] || "").trim() === question.correctAnswer.trim()
      ) {
        score += points;
      }
    });

    return { score, maxScore };
  }, [questions, responses]);

  const handleStart = async () => {
    if (!selectedEvaluation) return;

    try {
      setStarting(true);

      const response = await fetch("/api/dashboard/user/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          data: {
            evaluationId: selectedEvaluation.id,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error starting evaluation");
      }

      setEvaluations((prev) =>
        prev.map((evaluation) =>
          evaluation.id === selectedEvaluation.id
            ? {
                ...evaluation,
                status: "in-progress",
                started_at: new Date().toISOString(),
              }
            : evaluation
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error starting evaluation");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEvaluation) return;

    try {
      setSubmitting(true);

      const response = await fetch("/api/dashboard/user/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "submit",
          data: {
            evaluationId: selectedEvaluation.id,
            responses,
            score: scorePreview.score,
            maxScore: scorePreview.maxScore,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error submitting evaluation");
      }

      setEvaluations((prev) =>
        prev.map((evaluation) =>
          evaluation.id === selectedEvaluation.id
            ? {
                ...evaluation,
                status: "completed",
                submitted_at: new Date().toISOString(),
                score: scorePreview.score,
                max_score: scorePreview.maxScore,
              }
            : evaluation
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error submitting evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const setResponse = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

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
              Inicia, responde y envía tus evaluaciones asignadas.
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
                            : `${parseQuestions(evaluation).length} preguntas`}
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
                const isCompleted = normalizedStatus === "completed";
                const canStart =
                  normalizedStatus === "pending" || normalizedStatus === "available";
                const canAnswer = normalizedStatus === "in-progress";

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
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

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Target size={16} className="text-green-600" />
                          <span className="font-medium">Progreso actual</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {progress}%
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

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h4 className="font-medium text-gray-900">
                          Preguntas
                        </h4>

                        <div className="text-sm text-gray-500">
                          {questions.length} total
                        </div>
                      </div>

                      {questions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                          Esta evaluación no tiene preguntas configuradas todavía.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questions.map((question, index) => {
                            const value = responses[question.id] || "";
                            const disabled = !canAnswer || isCompleted;

                            return (
                              <div
                                key={question.id}
                                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                              >
                                <div className="mb-3">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {index + 1}. {question.question}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {question.required ? "Obligatoria" : "Opcional"}
                                  </p>
                                </div>

                                {(question.type === "multiple-choice" ||
                                  question.type === "single-choice") &&
                                question.options?.length ? (
                                  <div className="space-y-2">
                                    {question.options.map((option) => (
                                      <label
                                        key={option.value}
                                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                                          disabled
                                            ? "border-gray-200 bg-white opacity-80"
                                            : "border-gray-200 bg-white cursor-pointer hover:border-green-300"
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={question.id}
                                          value={option.value}
                                          checked={value === option.value}
                                          onChange={(e) =>
                                            setResponse(question.id, e.target.value)
                                          }
                                          disabled={disabled}
                                          className="accent-green-600"
                                        />
                                        <span className="text-gray-700">
                                          {option.label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                ) : question.type === "textarea" ? (
                                  <textarea
                                    value={value}
                                    onChange={(e) =>
                                      setResponse(question.id, e.target.value)
                                    }
                                    rows={5}
                                    disabled={disabled}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 disabled:bg-gray-100"
                                    placeholder="Escribe tu respuesta..."
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) =>
                                      setResponse(question.id, e.target.value)
                                    }
                                    disabled={disabled}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 disabled:bg-gray-100"
                                    placeholder="Escribe tu respuesta..."
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Puntaje estimado
                        </p>
                        <p className="text-sm text-gray-500">
                          Vista previa calculada en cliente cuando existe
                          `correctAnswer`.
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {scorePreview.score}/{scorePreview.maxScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {canStart && (
  <button
    type="button"
    onClick={handleOpenGoogleForm}
    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
  >
    <PlayCircle size={16} />
    Iniciar evaluación
  </button>
)}

                      {canAnswer && questions.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
                        >
                          {submitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          {submitting ? "Enviando..." : "Enviar evaluación"}
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
  onClose={() => {
    setIsFormModalOpen(false);
    setActiveGoogleFormId(null);
    setActiveGoogleFormTitle("");
  }}
  title={activeGoogleFormTitle}
  googleFormId={activeGoogleFormId}
/>
</>
  );
}