"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  Save,
  Target,
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
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  }
  return details;
}

function getStatusConfig(status: TaskStatus) {
  switch (status) {
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

function normalizeUrl(url?: string) {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getResourceTypeLabel(type?: string) {
  if (!type) return "Recurso";

  switch (type.toLowerCase()) {
    case "pdf":
      return "PDF";
    case "link":
      return "Link";
    case "video":
      return "Video";
    case "doc":
    case "document":
      return "Documento";
    default:
      return type;
  }
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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/user/tasks", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error loading tasks");
        }

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
    if (!selectedTaskId) {
      setSelectedTask(null);
      setDetailError(null);
      return;
    }

    const fetchTaskDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);

        const response = await fetch(
          `/api/dashboard/user/tasks/${selectedTaskId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error loading task detail");
        }

        setSelectedTask(data.task);
      } catch (err) {
        setSelectedTask(null);
        setDetailError(
          err instanceof Error ? err.message : "Error loading task detail"
        );
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

      const response = await fetch("/api/dashboard/user/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          status,
          progress,
          details: {
            ...parseDetails(selectedTask.details),
            userNotes,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error updating task");
      }

      const updatedCompletedDate =
        status === "completed"
          ? selectedTask.completed_date ?? new Date().toISOString()
          : selectedTask.completed_date;

      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status,
              progress,
              details: {
                ...parseDetails(prev.details),
                userNotes,
              },
              completed_date: updatedCompletedDate,
            }
          : prev
      );

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status,
                progress,
              }
            : task
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating task");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    };
  }, [tasks]);

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
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Mis tareas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Consulta tus tareas asignadas, actualiza tu estado y registra tu
              avance.
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
              <p className="text-xs font-medium text-emerald-700">
                Completadas
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Lista de tareas</h3>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                No tienes tareas asignadas todavía.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const statusConfig = getStatusConfig(task.status);
                  const StatusIcon = statusConfig.icon;
                  const isSelected = selectedTaskId === task.id;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-green-300 bg-white shadow-sm ring-2 ring-green-500/20"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {task.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {task.description}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className={
                            isSelected ? "text-green-600" : "text-gray-400"
                          }
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
                          {task.progress ?? 0}%
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            task.status === "completed"
                              ? "bg-emerald-500"
                              : task.status === "in-progress"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${task.progress ?? 0}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            {!selectedTaskId ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    Selecciona una tarea
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Elige una tarea de la lista para ver su detalle completo.
                  </p>
                </div>
              </div>
            ) : detailLoading ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando detalle...
                </div>
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {detailError}
              </div>
            ) : !selectedTask ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
                No se pudo cargar la tarea seleccionada.
              </div>
            ) : (
              (() => {
                const details = parseDetails(selectedTask.details);
                const statusConfig = getStatusConfig(status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot}`}
                          />
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.badge}`}
                          >
                            <StatusIcon size={14} />
                            {statusConfig.label}
                          </span>
                        </div>

                        <h3 className="text-2xl font-semibold text-gray-900">
                          {selectedTask.title}
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                          {selectedTask.description}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Target size={16} className="text-green-600" />
                          <span className="font-medium">Avance actual</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {progress}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Calendar size={16} className="text-blue-600" />
                          Fecha límite
                        </div>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedTask.due_date)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock3 size={16} className="text-violet-600" />
                          Horas estimadas
                        </div>
                        <p className="text-sm text-gray-900">
                          {details.estimatedHours
                            ? `${details.estimatedHours}h`
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

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <h4 className="mb-3 font-medium text-gray-900">
                          Recursos
                        </h4>

                        {selectedTask.resources &&
                        selectedTask.resources.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedTask.resources.map((resource) => (
                              <li key={resource.id}>
                                <a
                                  href={normalizeUrl(resource.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm transition hover:border-gray-300 hover:bg-white"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-900">
                                      {resource.name}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-gray-500">
                                      {resource.url}
                                    </p>
                                  </div>

                                  <span className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase text-gray-600">
                                    {getResourceTypeLabel(resource.type)}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No hay recursos asociados a esta tarea.
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <h4 className="mb-4 font-medium text-gray-900">
                          Actualizar tarea
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Estado
                            </label>
                            <select
                              value={status}
                              onChange={(e) =>
                                setStatus(e.target.value as TaskStatus)
                              }
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="in-progress">En progreso</option>
                              <option value="completed">Completada</option>
                            </select>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">
                                Progreso
                              </label>
                              <span className="text-sm font-semibold text-gray-900">
                                {progress}%
                              </span>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={progress}
                              onChange={(e) => setProgress(Number(e.target.value))}
                              className="w-full accent-green-500"
                            />

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Notas del usuario
                            </label>
                            <textarea
                              value={userNotes}
                              onChange={(e) => setUserNotes(e.target.value)}
                              rows={5}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500"
                              placeholder="Agrega observaciones, avances o bloqueos..."
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
                            >
                              {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Save size={16} />
                              )}
                              {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Asignada
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedTask.assigned_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Completada
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedTask.completed_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Asignada por
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTask.assigned_by_name || "—"}
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
  );
}