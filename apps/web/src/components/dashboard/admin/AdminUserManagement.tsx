"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  Send,
  Target,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeUrl, getResourceTypeLabel } from "@/lib/utils";

interface AdminManagedUser {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: string | null;
  lastSeen: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
  productivityScore: number;
}

type TaskStatus = "pending" | "in-progress" | "completed";

interface UserTaskDetails {
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
  details?: UserTaskDetails | string | null;
  assigned_by_name?: string | null;
  resources?: TaskResource[];
}

function parseTaskDetails(details: UserTaskDetail["details"]): UserTaskDetails {
  if (!details) return {};
  if (typeof details === "string") {
    try { return JSON.parse(details); }
    catch { return {}; }
  }
  return details;
}

function getTaskStatusUI(status: TaskStatus) {
  switch (status) {
    case "pending":
      return { label: "Pendiente", icon: AlertCircle, badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500" };
    case "in-progress":
      return { label: "En progreso", icon: PlayCircle, badge: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-500" };
    case "completed":
      return { label: "Completada", icon: CheckCircle2, badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" };
    default:
      return { label: "Pendiente", icon: AlertCircle, badge: "bg-gray-100 text-gray-700 border-gray-200", bar: "bg-gray-400" };
  }
}

function formatDate(val: string | null | undefined) {
  return val
    ? new Date(val).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
    : "—";
}

function TaskDetailView({
  task,
  onBack,
}: {
  task: UserTaskDetail;
  onBack: () => void;
}) {
  const details = parseTaskDetails(task.details);
  const statusUI = getTaskStatusUI(task.status);
  const StatusIcon = statusUI.icon;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Volver al usuario
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusUI.badge}`}>
              <StatusIcon size={14} />
              {statusUI.label}
            </span>
            <h4 className="mt-2 text-3xl font-semibold text-gray-900">{task.title}</h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{task.description}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Target size={16} className="text-green-600" />
              <span className="font-medium">Avance actual</span>
            </div>
            <p className="mt-1 text-3xl font-bold text-gray-900">{task.progress ?? 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar size={16} className="text-blue-600" />
            Fecha límite
          </div>
          <p className="text-sm text-gray-900">{formatDate(task.due_date)}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock3 size={16} className="text-violet-600" />
            Horas estimadas
          </div>
          <p className="text-sm text-gray-900">
            {details.estimatedHours ? `${details.estimatedHours}h` : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText size={16} className="text-amber-600" />
            Tipo
          </div>
          <p className="text-sm capitalize text-gray-900">{details.type || "—"}</p>
        </div>
      </div>

      {details.instructions && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h5 className="mb-2 font-medium text-gray-900">Instrucciones</h5>
          <p className="text-sm leading-6 text-gray-600">{details.instructions}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h5 className="mb-3 font-medium text-gray-900">Recursos</h5>
          {task.resources && task.resources.length > 0 ? (
            <ul className="space-y-2">
              {task.resources.map((resource) => (
                <li key={resource.id}>
                  <a
                    href={normalizeUrl(resource.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm transition hover:border-gray-300 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{resource.name}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">{resource.url}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase text-gray-600">
                      {getResourceTypeLabel(resource.type)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No hay recursos asociados a esta tarea.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h5 className="mb-4 font-medium text-gray-900">Resumen de progreso</h5>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-semibold text-gray-900">{task.progress ?? 0}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${statusUI.bar}`}
              style={{ width: `${task.progress ?? 0}%` }}
            />
          </div>
          {details.userNotes && (
            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Notas del usuario
              </p>
              <p className="text-sm text-gray-700">{details.userNotes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Asignada</p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(task.assigned_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completada</p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(task.completed_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Asignada por</p>
            <p className="mt-1 text-sm text-gray-900">{task.assigned_by_name || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userTasks, setUserTasks] = useState<UserTaskListItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<UserTaskDetail | null>(null);
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"user" | "task">("user");

  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [creating, setCreating] = useState(false);

  const openNewUser = () => {
    setNewUserForm({ name: "", email: "", password: "", role: "user" });
    setShowNewUser(true);
  };

  const closeNewUser = () => { if (!creating) setShowNewUser(false); };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error al crear usuario"); return; }
      toast.success("Usuario creado correctamente");
      setShowNewUser(false);
      await loadUsers();
    } catch {
      toast.error("Error de red");
    } finally {
      setCreating(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
      const data = await res.json();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) setSelectedUserId(data[0].id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForUser = async (userId: string) => {
    try {
      setTasksLoading(true);
      const res = await fetch(`/api/dashboard/admin/users/${userId}/tasks`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar las tareas del usuario");
      const data = await res.json();
      setUserTasks(data.tasks || []);
      setSelectedTaskId(null);
      setSelectedTaskDetail(null);
      setTaskDetailError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar las tareas";
      toast.error(msg);
      setUserTasks([]);
      setSelectedTaskId(null);
      setSelectedTaskDetail(null);
      setTaskDetailError(null);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadTaskDetail = async (userId: string, taskId: string) => {
    try {
      setTaskDetailLoading(true);
      setTaskDetailError(null);
      setSelectedTaskDetail(null);
      const res = await fetch(`/api/dashboard/admin/users/${userId}/tasks/${taskId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el detalle de la tarea");
      setSelectedTaskDetail(data.task);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle de la tarea";
      setTaskDetailError(msg);
      toast.error(msg);
    } finally {
      setTaskDetailLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    setViewMode("user");
    setSelectedTaskId(null);
    setSelectedTaskDetail(null);
    setTaskDetailError(null);
    loadTasksForUser(selectedUserId);
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const getStatusUI = (status: AdminManagedUser["status"]) => {
    const isActive = status === "active";
    return {
      bg: isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
      dot: isActive ? "bg-green-500" : "bg-gray-400",
      label: isActive ? "En línea" : "Desconectado",
    };
  };

  const openTaskDetail = async (taskId: string) => {
    if (!selectedUserId) return;
    setSelectedTaskId(taskId);
    setViewMode("task");
    await loadTaskDetail(selectedUserId, taskId);
  };

  const backToUserView = () => {
    setViewMode("user");
    setSelectedTaskId(null);
    setSelectedTaskDetail(null);
    setTaskDetailError(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="animate-pulse text-gray-500">Sincronizando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500">Monitorea la actividad y rendimiento de tu equipo.</p>
        </div>
        <button
          onClick={openNewUser}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 active:scale-95"
        >
          <UserPlus size={16} />
          Nuevo Usuario
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="max-h-[700px] space-y-3 overflow-y-auto pr-2 lg:col-span-1">
          {users.map((user) => {
            const ui = getStatusUI(user.status);
            const progress =
              user.tasksAssigned > 0
                ? Math.round((user.tasksCompleted / user.tasksAssigned) * 100)
                : 0;

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
                  selectedUserId === user.id
                    ? "border-green-500 bg-white shadow-md ring-1 ring-green-500"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-gray-900">
                      {user.name} {user.lastName}
                    </h3>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ui.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />
                    {ui.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Productividad</span>
                    <span className="font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full transition-all duration-500 ${progress > 70 ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="sticky top-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              {viewMode === "user" ? (
                <>
                  <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-gray-100 pb-6 md:flex-row">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-2xl font-bold text-white">
                        {selectedUser.name?.[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedUser.name} {selectedUser.lastName}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-500">{selectedUser.email}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span className="text-xs font-semibold uppercase tracking-tighter text-purple-600">
                            {selectedUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full gap-2 md:w-auto">
                      <button className="flex-1 rounded-xl bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 md:flex-none">
                        <Trash2 size={20} />
                      </button>
                      <button className="flex-1 rounded-xl bg-green-600 px-6 py-2 font-medium text-white shadow-sm transition-all hover:bg-green-700 md:flex-none">
                        Enviar Mensaje
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <section className="space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                        Estadísticas de Trabajo
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                          <p className="mb-1 text-xs font-medium text-blue-600">Tareas Totales</p>
                          <p className="text-2xl font-bold text-blue-900">{selectedUser.tasksAssigned}</p>
                        </div>
                        <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                          <p className="mb-1 text-xs font-medium text-green-600">Completadas</p>
                          <p className="text-2xl font-bold text-green-900">{selectedUser.tasksCompleted}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-medium text-purple-600">Score de Productividad</p>
                          <BarChart3 size={16} className="text-purple-400" />
                        </div>
                        <p className="text-3xl font-black text-purple-900">
                          {selectedUser.productivityScore}
                          <span className="text-sm font-normal text-purple-500">/100</span>
                        </p>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                        Actividad Reciente
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-gray-100 p-2 text-gray-500">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Último Login</p>
                            <p className="text-xs text-gray-500">{formatDate(selectedUser.lastLogin)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-gray-100 p-2 text-gray-500">
                            <Send size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Visto por última vez</p>
                            <p className="text-xs text-gray-500">{formatDate(selectedUser.lastSeen)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">
                        <button
                          disabled
                          title="Esta acción se gestiona desde la pestaña de asignación de tareas"
                          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-medium text-gray-500"
                        >
                          <Ban size={16} />
                          Asignar Nueva Tarea
                        </button>
                        <button className="w-full rounded-xl border border-gray-200 py-3 font-medium text-gray-600 transition-all hover:bg-gray-50">
                          Descargar Reporte Mensual
                        </button>
                      </div>
                    </section>
                  </div>

                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <div className="mb-5">
                      <h4 className="text-lg font-semibold text-gray-900">Tareas asignadas</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Visualiza el progreso y los detalles de las tareas del usuario.
                      </p>
                    </div>

                    {tasksLoading ? (
                      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3 text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Cargando tareas...</span>
                        </div>
                      </div>
                    ) : userTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
                        Este usuario no tiene tareas asignadas.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <ClipboardList size={18} className="text-green-600" />
                          <h5 className="font-semibold text-gray-900">Lista de tareas</h5>
                        </div>

                        <div className="space-y-3">
                          {userTasks.map((task) => {
                            const statusUI = getTaskStatusUI(task.status);
                            const StatusIcon = statusUI.icon;

                            return (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => openTaskDetail(task.id)}
                                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                              >
                                <div className="mb-2 flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-gray-900">{task.title}</p>
                                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>
                                  </div>
                                  <ChevronRight size={18} className="text-gray-400" />
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusUI.badge}`}>
                                    <StatusIcon size={14} />
                                    {statusUI.label}
                                  </span>
                                  <span className="text-xs font-medium text-gray-500">{task.progress ?? 0}%</span>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={`h-full rounded-full ${statusUI.bar}`}
                                    style={{ width: `${task.progress ?? 0}%` }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : taskDetailLoading ? (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={backToUserView}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    Volver al usuario
                  </button>
                  <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Cargando detalle de tarea...</span>
                    </div>
                  </div>
                </div>
              ) : taskDetailError ? (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={backToUserView}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} />
                    Volver al usuario
                  </button>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {taskDetailError}
                  </div>
                </div>
              ) : selectedTaskDetail ? (
                <TaskDetailView task={selectedTaskDetail} onBack={backToUserView} />
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-500">
                  Selecciona una tarea para ver sus detalles.
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                <Loader2 size={32} className="animate-pulse text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Selecciona un miembro</h3>
              <p className="max-w-xs text-sm text-gray-500">
                Haz clic en un usuario de la lista de la izquierda para ver su rendimiento detallado.
              </p>
            </div>
          )}
        </div>
      </div>

      {showNewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeNewUser}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
              <button onClick={closeNewUser} disabled={creating} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
                <input type="text" required value={newUserForm.name}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: María García"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
                <input type="email" required value={newUserForm.email}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
                <input type="password" required minLength={6} value={newUserForm.password}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
                <select value={newUserForm.role}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeNewUser} disabled={creating}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:opacity-60">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
