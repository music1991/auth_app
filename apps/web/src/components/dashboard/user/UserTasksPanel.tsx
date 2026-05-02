"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  Save,
  Target,
  X,
} from "lucide-react";

type TaskStatus = "pending" | "in-progress" | "completed";

interface TaskDetails {
  instructions?: string;
  requirements?: string[];
  estimatedHours?: number;
  type?: string;
  userNotes?: string;
}

interface TaskResource {
  id: number | string;
  name: string;
  type: string;
  url: string;
}

interface UserTaskListItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  due_date?: string | null;
}

interface UserTaskDetail {
  id: string;
  template_id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  assigned_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  details?: TaskDetails | string | null;
  assigned_by_name?: string | null;
  resources?: TaskResource[];
}

function parseDetails(details: UserTaskDetail["details"]): TaskDetails {
  if (!details) return {};
  if (typeof details === "string") {
    try { return JSON.parse(details); } catch { return {}; }
  }
  return details;
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function normalizeUrl(url?: string) {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getResourceTypeLabel(type?: string) {
  switch (type?.toLowerCase()) {
    case "pdf": return "PDF";
    case "link": return "Link";
    case "video": return "Video";
    case "doc":
    case "document": return "Doc";
    default: return type || "—";
  }
}

const COLUMN_CONFIG: Record<TaskStatus, {
  label: string;
  icon: typeof AlertCircle;
  header: string;
  headerText: string;
  badge: string;
  bar: string;
  emptyText: string;
}> = {
  pending: {
    label: "Pendiente",
    icon: AlertCircle,
    header: "bg-amber-50 border-amber-200",
    headerText: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
    emptyText: "Sin tareas pendientes",
  },
  "in-progress": {
    label: "En progreso",
    icon: PlayCircle,
    header: "bg-blue-50 border-blue-200",
    headerText: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    bar: "bg-blue-500",
    emptyText: "Ninguna en progreso",
  },
  completed: {
    label: "Completadas",
    icon: CheckCircle2,
    header: "bg-emerald-50 border-emerald-200",
    headerText: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    emptyText: "Aún no completaste tareas",
  },
};

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(23, 59, 59);
  return new Date() > due;
}

function TaskCard({
  task,
  onClick,
}: {
  task: UserTaskListItem;
  onClick: () => void;
}) {
  const config = COLUMN_CONFIG[task.status];
  const overdue = isOverdue(task.due_date) && task.status !== "completed";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:translate-y-0"
    >
      <p className="mb-1 line-clamp-2 font-medium text-gray-900 text-sm leading-snug">
        {task.title}
      </p>
      <p className="mb-3 line-clamp-2 text-xs text-gray-500">{task.description}</p>

      {task.status === "in-progress" && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-[11px] text-gray-400">
            <span>Progreso</span>
            <span className="font-medium text-gray-600">{task.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${config.bar}`} style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
          <config.icon size={11} />
          {config.label}
        </span>
        {task.due_date && (
          <span className={`flex items-center gap-1 text-[11px] ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
            <Calendar size={11} />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </button>
  );
}

function KanbanColumn({
  status,
  tasks,
  onCardClick,
}: {
  status: TaskStatus;
  tasks: UserTaskListItem[];
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
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3 py-8 text-center text-xs text-gray-400">
            {config.emptyText}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onCardClick(task.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function TaskDrawer({
  task,
  detailLoading,
  detailError,
  status,
  progress,
  userNotes,
  saving,
  onClose,
  onStatusChange,
  onProgressChange,
  onNotesChange,
  onSave,
}: {
  task: UserTaskDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  status: TaskStatus;
  progress: number;
  userNotes: string;
  saving: boolean;
  onClose: () => void;
  onStatusChange: (s: TaskStatus) => void;
  onProgressChange: (n: number) => void;
  onNotesChange: (s: string) => void;
  onSave: () => void;
}) {
  const config = COLUMN_CONFIG[status];
  const details = task ? parseDetails(task.details) : {};

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
          <div className="flex items-center gap-2">
            {task && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badge}`}>
                <config.icon size={12} />
                {config.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : detailError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {detailError}
            </div>
          ) : !task ? null : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-gray-500">{task.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <Calendar size={14} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-[11px] text-gray-400">Vence</p>
                  <p className="text-xs font-semibold text-gray-700">{formatDate(task.due_date)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <Clock3 size={14} className="mx-auto mb-1 text-violet-500" />
                  <p className="text-[11px] text-gray-400">Horas est.</p>
                  <p className="text-xs font-semibold text-gray-700">{details.estimatedHours ? `${details.estimatedHours}h` : "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <Target size={14} className="mx-auto mb-1 text-green-500" />
                  <p className="text-[11px] text-gray-400">Avance</p>
                  <p className="text-xs font-semibold text-gray-700">{progress}%</p>
                </div>
              </div>

              {details.instructions && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Instrucciones</p>
                  <p className="text-sm leading-6 text-gray-600">{details.instructions}</p>
                </div>
              )}

              {task.resources && task.resources.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recursos</p>
                  <div className="space-y-1.5">
                    {task.resources.map((r) => (
                      <a
                        key={r.id}
                        href={normalizeUrl(r.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm transition hover:border-green-200 hover:bg-green-50/40"
                      >
                        <span className="truncate font-medium text-gray-700">{r.name}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
                            {getResourceTypeLabel(r.type)}
                          </span>
                          <ExternalLink size={12} className="text-gray-400" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actualizar tarea</p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in-progress">En progreso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Progreso</label>
                    <span className="text-xs font-bold text-gray-700">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => onProgressChange(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Notas</label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                    placeholder="Observaciones, avances o bloqueos..."
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-[11px] text-gray-400 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-medium text-gray-500 mb-0.5">Asignada</p>
                  <p>{formatDate(task.assigned_date)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 mb-0.5">Completada</p>
                  <p>{formatDate(task.completed_date)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500 mb-0.5">Asignada por</p>
                  <p className="truncate">{task.assigned_by_name || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {task && !detailLoading && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserTasksPanel() {
  const [tasks, setTasks] = useState<UserTaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<UserTaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [status, setStatus] = useState<TaskStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [activeColumn, setActiveColumn] = useState<TaskStatus>("pending");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/dashboard/user/tasks", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error loading tasks");
        setTasks(data.tasks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!selectedTaskId) { setSelectedTask(null); setDetailError(null); return; }

    const fetchTaskDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        const res = await fetch(`/api/dashboard/user/tasks/${selectedTaskId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error loading task detail");
        setSelectedTask(data.task);
      } catch (err) {
        setSelectedTask(null);
        setDetailError(err instanceof Error ? err.message : "Error loading task detail");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchTaskDetail();
  }, [selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) return;
    const details = parseDetails(selectedTask.details);
    setStatus(selectedTask.status);
    setProgress(selectedTask.progress ?? 0);
    setUserNotes(details.userNotes || "");
  }, [selectedTask]);

  const handleSave = async () => {
    if (!selectedTask) return;
    try {
      setSaving(true);
      const res = await fetch("/api/dashboard/user/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          status,
          progress,
          details: { ...parseDetails(selectedTask.details), userNotes },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error updating task");

      setSelectedTask((prev) =>
        prev ? { ...prev, status, progress, details: { ...parseDetails(prev.details), userNotes } } : prev
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? { ...t, status, progress } : t))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating task");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => ({
    pending: tasks.filter((t) => t.status === "pending"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    completed: tasks.filter((t) => t.status === "completed"),
  }), [tasks]);

  const stats = useMemo(() => ({
    pending: columns.pending.length,
    inProgress: columns["in-progress"].length,
    completed: columns.completed.length,
  }), [columns]);

  const handleCardClick = (id: string) => setSelectedTaskId(id);
  const handleCloseDrawer = () => setSelectedTaskId(null);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-1">
        <div className="h-8 w-48 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-10 rounded-xl bg-gray-100" />
              {[0, 1, 2].map((j) => <div key={j} className="h-24 rounded-xl bg-gray-100" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const COLUMNS: TaskStatus[] = ["pending", "in-progress", "completed"];
  const COLUMN_LABELS: Record<TaskStatus, string> = {
    pending: `Pendientes (${stats.pending})`,
    "in-progress": `En progreso (${stats.inProgress})`,
    completed: `Completadas (${stats.completed})`,
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-gray-900">Mis tareas</h2>
          <p className="text-sm text-gray-500">{tasks.length} tareas asignadas</p>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 lg:hidden">
          {COLUMNS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setActiveColumn(col)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                activeColumn === col
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {COLUMN_LABELS[col]}
            </button>
          ))}
        </div>

        {/* Mobile: single active column */}
        <div className="lg:hidden">
          <KanbanColumn
            status={activeColumn}
            tasks={columns[activeColumn]}
            onCardClick={handleCardClick}
          />
        </div>

        {/* Desktop: 3 columns */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              status={col}
              tasks={columns[col]}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {selectedTaskId && (
        <TaskDrawer
          task={selectedTask}
          detailLoading={detailLoading}
          detailError={detailError}
          status={status}
          progress={progress}
          userNotes={userNotes}
          saving={saving}
          onClose={handleCloseDrawer}
          onStatusChange={setStatus}
          onProgressChange={setProgress}
          onNotesChange={setUserNotes}
          onSave={handleSave}
        />
      )}
    </>
  );
}
