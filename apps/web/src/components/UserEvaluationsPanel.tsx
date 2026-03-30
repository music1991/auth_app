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
} from "lucide-react";
import EvaluationFormModal from "./dashboard/EvaluationFormModal";
import { finishEvaluation, startEvaluation } from "@/services/formServicesApi";

import { formatDateShort } from "@/lib/utils";
import { EVALUATION_TYPE_LABELS } from "@/lib/constants";
import { EvaluationType } from "@/app/types/types";

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
  dueDate?: string;
  started_at?: string | null;
  submitted_at?: string | null;
  score: number | null;
  max_score?: number | null;
  details?: EvaluationDetails | string | null;
  assigned_by_name?: string | null;
  google_form_id?: string | null;
  type: string;
  online: boolean;
}

interface StatusConfig {
  label: string;
  icon: typeof AlertCircle;
  badge: string;
  dot: string;
}

/* const formatDateShort = (date: string | null | undefined) => {
  if (!date) return "";
  const cleanDate = date.replace(/"/g, '').trim();
  const newDate = new Date(cleanDate);

  if (isNaN(newDate.getTime())) {
    return "Fecha inválida";
  }

  return newDate.toLocaleDateString('es-ES');
}; */

function isEvaluationExpired(dueDate?: string | null) {
  if (!dueDate) return false;

  const cleanDate = dueDate.replace(/"/g, '').trim();
  const due = new Date(cleanDate);
  const today = new Date();

  if (isNaN(due.getTime())) return false;

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  console.log("Hoy:", today.toDateString()); //controlar la fecha con la q guarda..
  console.log("Vence:", due.toDateString());

  return today > due;
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

function parseDetails(details: UserEvaluation["details"]): EvaluationDetails {
  return parseJson<EvaluationDetails>(details, {});
}

function normalizeStatus(status?: number | null): EvaluationStatus {
  if (status === 0 || status === 1 || status === 2 || status === 3) {
    return status;
  }

  return 0;
}

function getStatusConfig(status: EvaluationStatus): StatusConfig {
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
        label: "Comenzada",
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


function getEvaluationScore(evaluation: UserEvaluation) {
  if (evaluation.score != null && evaluation.max_score != null) {
    return `${evaluation.score}/${evaluation.max_score}`;
  }

  if (evaluation.score != null) {
    return `${evaluation.score}`;
  }

  return "—";
}

function canStartEvaluation(status: EvaluationStatus) {
  return status === 0 || status === 1;
}

function SummaryStatCard({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function EvaluationsListItem({
  evaluation,
  isSelected,
  onSelect,
}: {
  evaluation: UserEvaluation;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const status = normalizeStatus(evaluation.status);
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(evaluation.id)}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${isSelected
        ? "border-green-300 bg-white shadow-sm ring-2 ring-green-500/20"
        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{evaluation.title}</p>
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
          {getEvaluationScore(evaluation) === "—"
            ? "Sin resultado"
            : getEvaluationScore(evaluation)}
        </span>
      </div>
    </button>
  );
}

function EmptyEvaluationsState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      No tienes evaluaciones asignadas todavía.
    </div>
  );
}

function EmptySelectedEvaluationState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
      Selecciona una evaluación para ver sus detalles.
    </div>
  );
}

function DetailMetricCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | null | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon}
        {title}
      </div>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function DetailDateItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">{formatDateShort(value!)}</p>
    </div>
  );
}

function EvaluationDetailHeader({
  evaluation,
  statusConfig,
}: {
  evaluation: UserEvaluation;
  statusConfig: StatusConfig;
}) {
  const StatusIcon = statusConfig.icon;

  return (
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

        <h3 className="text-2xl font-semibold text-gray-900">{evaluation.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          {evaluation.description || "Sin descripción"}
        </p>
      </div>
    </div>
  );
}

function EvaluationDetailMetrics({
  evaluation,
  details,
}: {
  evaluation: UserEvaluation;
  details: EvaluationDetails;
}) {

  return (


    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <DetailMetricCard
        icon={<Clock3 size={16} className="text-violet-600" />}
        title="Duración"
        value={details.durationMinutes ? `${details.durationMinutes} min` : "—"}
      />

      <DetailMetricCard
        icon={<FileText size={16} className="text-amber-600" />}
        title="Tipo"
        value={EVALUATION_TYPE_LABELS[evaluation.type as EvaluationType] || "-"}
      />

      <DetailMetricCard
        icon={<CheckCircle2 size={16} className="text-emerald-600" />}
        title="Resultado"
        value={evaluation.status === 3 ? evaluation.score : "-"}
      />
    </div>
  );
}

function EvaluationDetailInstructions({
  instructions,
}: {
  instructions?: string;
}) {
  if (!instructions) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <h4 className="mb-2 font-medium text-gray-900">Instrucciones</h4>
      <p className="text-sm leading-6 text-gray-600">{instructions}</p>
    </div>
  );
}

function EvaluationDetailActions({
  canStart,
  starting,
  onStart,
}: {
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
}) {
  if (!canStart) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={onStart}
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
    </div>
  );
}

function EvaluationDetailDates({
  evaluation,
}: {
  evaluation: UserEvaluation;
}) {

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DetailDateItem label="Fecha límite" value={evaluation.dueDate} />
        <DetailDateItem label="Iniciada" value={evaluation.started_at} />
        <DetailDateItem label="Enviada" value={evaluation.submitted_at} />
      </div>
    </div>
  );
}

function EvaluationDetail({
  evaluation,
  starting,
  onStart,
}: {
  evaluation: UserEvaluation;
  starting: boolean;
  onStart: () => void;
}) {
  const details = parseDetails(evaluation.details);
  const normalizedStatus = normalizeStatus(evaluation.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const canStart = canStartEvaluation(normalizedStatus);

  const isExpired = isEvaluationExpired(evaluation.dueDate);
  const isCompleted = normalizedStatus === 3;
  const showExpiredMessage = isExpired && !isCompleted;

  console.log("evaluation", evaluation)
  return (
    <div className="space-y-6">
      <EvaluationDetailHeader evaluation={evaluation} statusConfig={statusConfig} />

      <EvaluationDetailMetrics evaluation={evaluation} details={details} />

      <EvaluationDetailInstructions instructions={details.instructions} />

      {showExpiredMessage ? (
        <div className="flex justify-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 shadow-sm">
            <AlertCircle size={14} className="animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Evaluación vencida
            </span>
          </div>
        </div>
      ) : (
        evaluation.online ?
          <div className="flex justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">

              {/*         <div className="flex gap-0.5">
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
        </div> */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tight leading-none">
                  Pendiente de carga
                </span>
              </div>
            </div>
          </div>
          :
          <EvaluationDetailActions
            canStart={canStart}
            starting={starting}
            onStart={onStart}
          />


      )}

      <EvaluationDetailDates evaluation={evaluation} />
    </div>
  );
}

function EvaluationsList({
  evaluations,
  selectedEvaluationId,
  onSelect,
}: {
  evaluations: UserEvaluation[];
  selectedEvaluationId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-green-600" />
        <h3 className="font-semibold text-gray-900">Lista de evaluaciones</h3>
      </div>

      {evaluations.length === 0 ? (
        <EmptyEvaluationsState />
      ) : (
        <div className="space-y-3">
          {evaluations.map((evaluation) => (
            <EvaluationsListItem
              key={evaluation.id}
              evaluation={evaluation}
              isSelected={selectedEvaluationId === evaluation.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EvaluationsSummary({
  pending,
  inProgress,
  completed,
}: {
  pending: number;
  inProgress: number;
  completed: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryStatCard
        title="Pendientes"
        value={pending}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700"
      />
      <SummaryStatCard
        title="En progreso"
        value={inProgress}
        className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700"
      />
      <SummaryStatCard
        title="Completadas"
        value={completed}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700"
      />
    </div>
  );
}

function EvaluationsSkeleton() {
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

function EvaluationsErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
      {error}
    </div>
  );
}

export default function UserEvaluationsPanel() {
  const [evaluations, setEvaluations] = useState<UserEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeGoogleFormId, setActiveGoogleFormId] = useState<string | null>(null);
  const [activeGoogleFormTitle, setActiveGoogleFormTitle] = useState("");

  const selectedEvaluation = useMemo(() => {
    return (
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) || null
    );
  }, [evaluations, selectedEvaluationId]);

  const stats = useMemo(() => {
    const normalized = evaluations.map((evaluation) =>
      normalizeStatus(evaluation.status)
    );

    return {
      pending: normalized.filter((status) => status === 0 || status === 1).length,
      inProgress: normalized.filter((status) => status === 2).length,
      completed: normalized.filter((status) => status === 3).length,
    };
  }, [evaluations]);

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

      if (incomingEvaluations.length === 0) {
        setSelectedEvaluationId(null);
        return;
      }

      setSelectedEvaluationId((prevSelectedId) => {
        if (!prevSelectedId) {
          return incomingEvaluations[0].id;
        }

        const exists = incomingEvaluations.some(
          (evaluation) => evaluation.id === prevSelectedId
        );

        return exists ? prevSelectedId : incomingEvaluations[0].id;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading evaluations");
    } finally {
      setLoading(false);
    }
  };

  const resetFormModalState = () => {
    setIsFormModalOpen(false);
    setActiveGoogleFormId(null);
    setActiveGoogleFormTitle("");
  };

  const handleOpenGoogleForm = async () => {
    if (!selectedEvaluation?.google_form_id || !selectedEvaluationId) {
      alert("Esta evaluación no tiene un Google Form configurado");
      return;
    }

    try {
      setStarting(true);

      const success = await startEvaluation(selectedEvaluationId);

      if (!success) {
        alert("No se pudo iniciar la evaluación. Inténtalo de nuevo.");
        return;
      }

      await fetchEvaluations();
      setActiveGoogleFormId(selectedEvaluation.google_form_id);
      setActiveGoogleFormTitle(selectedEvaluation.title || "Evaluación");
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Ocurrió un error al conectar con el servidor.");
    } finally {
      setStarting(false);
    }
  };

  const handleCloseFormModal = async () => {
    try {
      if (selectedEvaluationId) {
        const success = await finishEvaluation(selectedEvaluationId);

        if (success) {
          await fetchEvaluations();
        }
      }
    } catch (error) {
      console.error("Error al finalizar evaluación:", error);
    } finally {
      resetFormModalState();
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  if (loading) {
    return <EvaluationsSkeleton />;
  }

  if (error) {
    return <EvaluationsErrorState error={error} />;
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

            <EvaluationsSummary
              pending={stats.pending}
              inProgress={stats.inProgress}
              completed={stats.completed}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <EvaluationsList
              evaluations={evaluations}
              selectedEvaluationId={selectedEvaluationId}
              onSelect={setSelectedEvaluationId}
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              {selectedEvaluation ? (
                <EvaluationDetail
                  evaluation={selectedEvaluation}
                  starting={starting}
                  onStart={handleOpenGoogleForm}
                />
              ) : (
                <EmptySelectedEvaluationState />
              )}
            </div>
          </div>
        </div>
      </div>

      <EvaluationFormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={activeGoogleFormTitle}
        googleFormId={activeGoogleFormId}
      />
    </>
  );
}