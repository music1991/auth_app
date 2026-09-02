"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  X,
} from "lucide-react";

import { startEvaluation } from "@/services/form";
import { formatDateShort, isEvaluationExpired } from "@/lib/utils";
import { isEvaluationApproved } from "@/lib/formulas";
import { EVALUATION_TYPE_LABELS } from "@/lib/constants";
import { EvaluationType } from "@/types";
import EvaluationFormModal from "../EvaluationFormModal";

type EvaluationStatus = "pending" | "in_progress" | "completed" | "expired";

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
  assignedDate?: string;
  dueDate?: string;
  started_at?: string | null;
  submitted_at?: string | null;
  score: number | null;
  maxScore?: number | null;
  passingScorePct?: number;
  details?: EvaluationDetails | string | null;
  assignedByName?: string | null;
  google_form_id?: string | null;
  type: string;
  online: boolean;
}

function parseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value;
}

function parseDetails(details: UserEvaluation["details"]): EvaluationDetails {
  return parseJson<EvaluationDetails>(details, {});
}

function getEvaluationScore(ev: UserEvaluation) {
  if (ev.score != null && ev.maxScore != null) return `${ev.score}/${ev.maxScore}`;
  if (ev.score != null) return `${ev.score}`;
  return null;
}

function getApprovalLabel(ev: UserEvaluation): { text: string; approved: boolean } | null {
  if (ev.status !== "completed" || ev.score == null || ev.maxScore == null) return null;
  const approved = isEvaluationApproved(ev.score, ev.maxScore, ev.passingScorePct);
  return { text: approved ? "Aprobada" : "No aprobada", approved };
}

const COLUMN_CONFIG: Record<EvaluationStatus, {
  label: string;
  icon: typeof AlertCircle;
  header: string;
  headerText: string;
  badge: string;
  emptyText: string;
}> = {
  pending: {
    label: "Pendiente",
    icon: AlertCircle,
    header: "bg-amber-50 border-amber-200",
    headerText: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    emptyText: "Sin evaluaciones pendientes",
  },
  in_progress: {
    label: "En curso",
    icon: PlayCircle,
    header: "bg-blue-50 border-blue-200",
    headerText: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    emptyText: "Ninguna en curso",
  },
  completed: {
    label: "Completadas",
    icon: CheckCircle2,
    header: "bg-emerald-50 border-emerald-200",
    headerText: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    emptyText: "Aún no completaste evaluaciones",
  },
  expired: {
    label: "Vencidas",
    icon: AlertCircle,
    header: "bg-red-50 border-red-200",
    headerText: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
    emptyText: "Sin evaluaciones vencidas",
  },
};

function EvalCard({
  evaluation,
  onClick,
}: {
  evaluation: UserEvaluation;
  onClick: () => void;
}) {
  const rawStatus = evaluation.status ?? "pending";
  const isExpired = isEvaluationExpired(evaluation.dueDate) && rawStatus !== "completed";
  const status: EvaluationStatus = isExpired ? "expired" : rawStatus;
  const config = COLUMN_CONFIG[status];
  const score = getEvaluationScore(evaluation);
  const approval = getApprovalLabel(evaluation);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:translate-y-0"
    >
      <p className="mb-1 line-clamp-2 font-medium text-gray-900 text-sm leading-snug">
        {evaluation.title}
      </p>
      <p className="mb-3 line-clamp-2 text-xs text-gray-500">
        {evaluation.description || "Sin descripción"}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
          <config.icon size={11} />
          {config.label}
        </span>
        <div className="flex items-center gap-2">
          {approval && (
            <span
              className={`text-[11px] font-semibold ${
                approval.approved ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {approval.text}
            </span>
          )}
          {score && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <BarChart3 size={11} />
              {score}
            </span>
          )}
          {evaluation.dueDate && !score && (
            <span className={`flex items-center gap-1 text-[11px] ${isExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
              <Calendar size={11} />
              {formatDateShort(evaluation.dueDate)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function EvalColumn({
  status,
  evaluations,
  onCardClick,
}: {
  status: EvaluationStatus;
  evaluations: UserEvaluation[];
  onCardClick: (id: string) => void;
}) {
  const config = COLUMN_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col min-h-0">
      <div className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2 ${config.header}`}>
        <div className={`flex items-center gap-2 text-sm font-semibold ${config.headerText}`}>
          <Icon size={15} />
          {config.label}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${config.headerText} bg-white/70`}>
          {evaluations.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {evaluations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-8 text-center text-xs text-gray-400">
            {config.emptyText}
          </div>
        ) : (
          evaluations.map((ev) => (
            <EvalCard key={ev.id} evaluation={ev} onClick={() => onCardClick(ev.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function EvalDrawer({
  evaluation,
  starting,
  onClose,
  onStart,
}: {
  evaluation: UserEvaluation;
  starting: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const rawStatus = evaluation.status ?? "pending";
  const isExpired = isEvaluationExpired(evaluation.dueDate) && rawStatus !== "completed";
  const status: EvaluationStatus = isExpired ? "expired" : rawStatus;
  const config = COLUMN_CONFIG[status];
  const details = parseDetails(evaluation.details);
  const score = getEvaluationScore(evaluation);
  const approval = getApprovalLabel(evaluation);
  const canStart = (rawStatus === "pending" || rawStatus === "in_progress") && !isExpired && evaluation.online;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badge}`}>
            <config.icon size={12} />
            {config.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{evaluation.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-gray-500">
              {evaluation.description || "Sin descripción"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <Clock3 size={14} className="mx-auto mb-1 text-violet-500" />
              <p className="text-[11px] text-gray-400">Duración</p>
              <p className="text-xs font-semibold text-gray-700">
                {details.durationMinutes ? `${details.durationMinutes} min` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <FileText size={14} className="mx-auto mb-1 text-amber-500" />
              <p className="text-[11px] text-gray-400">Tipo</p>
              <p className="text-xs font-semibold text-gray-700 truncate">
                {EVALUATION_TYPE_LABELS[evaluation.type as EvaluationType] || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <BarChart3 size={14} className="mx-auto mb-1 text-emerald-500" />
              <p className="text-[11px] text-gray-400">Resultado</p>
              <p className="text-xs font-semibold text-gray-700">{score ?? "—"}</p>
            </div>
          </div>

          {approval && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                approval.approved
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {approval.text}
            </div>
          )}

          {details.instructions && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Instrucciones</p>
              <p className="text-sm leading-6 text-gray-600">{details.instructions}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="font-medium text-gray-500 mb-0.5">Vencimiento</p>
              <p className={`font-semibold ${isExpired && status !== "completed" ? "text-red-500" : "text-gray-700"}`}>
                {formatDateShort(evaluation.dueDate!)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500 mb-0.5">Asignada</p>
              <p className="text-gray-700">
                {formatDateShort(evaluation.assignedDate)}
                {evaluation.assignedByName && (
                  <span className="text-gray-400"> por {evaluation.assignedByName}</span>
                )}
              </p>
            </div>
          </div>

          {isExpired && status !== "completed" && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">Esta evaluación ha vencido</p>
            </div>
          )}

          {!evaluation.online && !isExpired && status !== "completed" && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Pendiente de carga por el administrador
            </div>
          )}
        </div>

        {canStart && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onStart}
              disabled={starting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              {starting ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />}
              {starting ? "Iniciando..." : rawStatus === "in_progress" ? "Continuar evaluación" : "Iniciar evaluación"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserEvaluationsPanel() {
  const [evaluations, setEvaluations] = useState<UserEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [activeGoogleFormId, setActiveGoogleFormId] = useState<string | null>(null);
  const [activeGoogleFormTitle, setActiveGoogleFormTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState<EvaluationStatus>("pending");

  const selected = useMemo(
    () => evaluations.find((e) => e.id === selectedId) || null,
    [evaluations, selectedId]
  );

  const columns = useMemo(() => {
    return {
      pending: evaluations.filter((e) => {
        const s = e.status ?? "pending";
        return s === "pending" && !isEvaluationExpired(e.dueDate);
      }),
      in_progress: evaluations.filter((e) => e.status === "in_progress" && !isEvaluationExpired(e.dueDate)),
      completed: evaluations.filter((e) => e.status === "completed"),
      expired: evaluations.filter((e) => {
        const s = e.status ?? "pending";
        return (s === "pending" || s === "in_progress") && isEvaluationExpired(e.dueDate);
      }),
    };
  }, [evaluations]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/user/evaluations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error loading evaluations");
      const incoming: UserEvaluation[] = data.evaluations || [];
      setEvaluations(incoming);
      if (incoming.length === 0) { setSelectedId(null); return; }
      setSelectedId((prev) => {
        if (!prev) return null;
        return incoming.some((e) => e.id === prev) ? prev : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading evaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleForm = async () => {
    if (!selected?.google_form_id || !selectedId) {
      alert("Esta evaluación no tiene un Google Form configurado");
      return;
    }
    try {
      setStarting(true);
      const success = await startEvaluation(selectedId);
      if (!success) { alert("No se pudo iniciar la evaluación."); return; }
      await fetchEvaluations();
      setActiveGoogleFormId(selected.google_form_id);
      setActiveGoogleFormTitle(selected.title || "Evaluación");
      setIsFormModalOpen(true);
    } catch {
      alert("Ocurrió un error al conectar con el servidor.");
    } finally {
      setStarting(false);
    }
  };

  const handleCloseFormModal = async () => {
    setIsFormModalOpen(false);
    setActiveGoogleFormId(null);
    setActiveGoogleFormTitle("");
    // El cierre del modal no confirma el envío del formulario: el estado
    // "completed" y el score solo los asigna el webhook de Google Forms.
    await fetchEvaluations();
  };

  useEffect(() => { fetchEvaluations(); }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-1">
        <div className="h-8 w-48 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-10 rounded-xl bg-gray-100" />
              {[0, 1].map((j) => <div key={j} className="h-24 rounded-xl bg-gray-100" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
    );
  }

  const COLUMNS: EvaluationStatus[] = ["pending", "in_progress", "completed", "expired"];
  const MOBILE_LABELS: Record<EvaluationStatus, string> = {
    pending: `Pendientes (${columns.pending.length})`,
    in_progress: `En curso (${columns.in_progress.length})`,
    completed: `Completadas (${columns.completed.length})`,
    expired: `Vencidas (${columns.expired.length})`,
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-gray-900">Mis evaluaciones</h2>
          <p className="text-sm text-gray-500">{evaluations.length} evaluaciones asignadas</p>
        </div>

        {/* Mobile tab switcher */}
        <div className="grid grid-cols-4 rounded-xl border border-gray-200 bg-gray-50 p-1 lg:hidden">
          {COLUMNS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setActiveColumn(col)}
              className={`rounded-lg py-2 text-[10px] font-medium transition-all ${
                activeColumn === col ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {MOBILE_LABELS[col]}
            </button>
          ))}
        </div>

        {/* Mobile: single column */}
        <div className="lg:hidden">
          <EvalColumn status={activeColumn} evaluations={columns[activeColumn]} onCardClick={setSelectedId} />
        </div>

        {/* Desktop: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
          {COLUMNS.map((col) => (
            <EvalColumn key={col} status={col} evaluations={columns[col]} onCardClick={setSelectedId} />
          ))}
        </div>
      </div>

      {selected && (
        <EvalDrawer
          evaluation={selected}
          starting={starting}
          onClose={() => setSelectedId(null)}
          onStart={handleOpenGoogleForm}
        />
      )}

      <EvaluationFormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={activeGoogleFormTitle}
        googleFormId={activeGoogleFormId}
      />
    </>
  );
}
