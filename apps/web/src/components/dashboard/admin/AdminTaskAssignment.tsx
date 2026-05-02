"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Circle, ClipboardList, Clock, Loader2, Plus, UserCircle, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useTaskTemplates, type TaskTemplate, type TaskTemplatePayload } from "@/hooks/useTaskTemplates";
import TaskTemplateModal from "../user/tasks/TaskTemplateModal";

type TaskStatus = "pending" | "in-progress" | "completed";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignedTask {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
  progress: number;
  instructions?: string;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.FC<{ size?: number; className?: string }>; border: string; headerBg: string; countBg: string; countText: string }[] = [
  { id: "pending",     label: "Pendiente",   icon: Circle,       border: "border-amber-200",   headerBg: "bg-amber-50",   countBg: "bg-amber-100",   countText: "text-amber-700" },
  { id: "in-progress", label: "En progreso", icon: Loader2,      border: "border-blue-200",    headerBg: "bg-blue-50",    countBg: "bg-blue-100",    countText: "text-blue-700"  },
  { id: "completed",   label: "Completada",  icon: CheckCircle2, border: "border-emerald-200", headerBg: "bg-emerald-50", countBg: "bg-emerald-100", countText: "text-emerald-700" },
];

function isOverdue(dueDate: string, status: TaskStatus) {
  return status !== "completed" && new Date(dueDate) < new Date();
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ task, title }: { task: AssignedTask; title: string }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="mb-1 text-sm font-semibold text-gray-800 line-clamp-2">{title}</p>
      <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
        <UserCircle size={13} />
        <span>{task.userName}</span>
      </div>
      {task.status === "in-progress" && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-blue-400 transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}
      <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500" : "text-gray-400"}`}>
        <Calendar size={11} />
        <span>{overdue ? "Vencida · " : ""}{fmt(task.dueDate)}</span>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, titleFor }: {
  col: typeof COLUMNS[number];
  tasks: AssignedTask[];
  titleFor: (id: string) => string;
}) {
  const Icon = col.icon;
  return (
    <div className={`flex flex-col rounded-2xl border ${col.border} bg-gray-50/60`}>
      <div className={`flex items-center justify-between rounded-t-2xl px-4 py-3 ${col.headerBg}`}>
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">{col.label}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.countBg} ${col.countText}`}>
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 p-3 min-h-[120px]">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">Sin tareas</p>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} title={titleFor(t.templateId)} />)
        )}
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete, onAssign }: {
  template: TaskTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  const typeColors: Record<string, string> = {
    course: "bg-purple-100 text-purple-700",
    report: "bg-blue-100 text-blue-700",
    project: "bg-orange-100 text-orange-700",
    task: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{template.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{template.description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColors[template.type] ?? typeColors.task}`}>
          {template.type}
        </span>
      </div>
      <div className="mb-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Clock size={11} />{template.estimatedHours}h estimadas</span>
        <span>{template.requirements.length} requisitos</span>
      </div>
      <div className="flex gap-2">
        <button onClick={onAssign}
          className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90">
          Asignar
        </button>
        <button onClick={onEdit}
          className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
          className="rounded-xl border border-red-100 p-2 text-red-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminTaskAssignment() {
  const { templates, loading: templatesLoading, submitting, error: templatesError, createTemplate, editTemplate, removeTemplate } = useTaskTemplates();

  const [activeTab, setActiveTab] = useState<"board" | "templates">("board");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allTasks, setAllTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile column
  const [mobileCol, setMobileCol] = useState<TaskStatus>("pending");

  // Assignment drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTemplate, setDrawerTemplate] = useState<TaskTemplate | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Template modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/dashboard/admin/tasks").then((r) => r.json()),
    ])
      .then(([usersData, tasksData]) => {
        setUsers(Array.isArray(usersData) ? usersData.filter((u) => u.role === "user") : []);
        setAllTasks(Array.isArray(tasksData) ? tasksData : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, AssignedTask[]> = { pending: [], "in-progress": [], completed: [] };
    for (const t of allTasks) if (map[t.status]) map[t.status].push(t);
    return map;
  }, [allTasks]);

  const titleFor = (templateId: string) =>
    templates.find((t) => t.id === templateId)?.title ?? "Tarea";

  const openDrawer = (template?: TaskTemplate) => {
    setDrawerTemplate(template ?? null);
    setSelectedUserId("");
    setDueDate("");
    setInstructions("");
    setDrawerOpen(true);
  };

  const handleAssign = async () => {
    if (!drawerTemplate || !selectedUserId || !dueDate) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/dashboard/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-task",
          data: {
            templateId: drawerTemplate.id,
            userId: selectedUserId,
            title: drawerTemplate.title,
            description: drawerTemplate.description,
            dueDate,
            details: {
              instructions,
              requirements: drawerTemplate.requirements,
              estimatedHours: drawerTemplate.estimatedHours,
              type: drawerTemplate.type,
            },
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const user = users.find((u) => u.id === selectedUserId);
      setAllTasks((prev) => [{
        id: result.taskId,
        templateId: drawerTemplate.id,
        userId: selectedUserId,
        userName: user?.name ?? "Usuario",
        assignedDate: new Date().toISOString().split("T")[0],
        dueDate,
        status: "pending",
        progress: 0,
        instructions,
      }, ...prev]);
      setDrawerOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al asignar");
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmitTemplate = async (data: TaskTemplatePayload) => {
    if (modalMode === "create") await createTemplate(data);
    else if (editingTemplate) await editTemplate(editingTemplate.id, data);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="relative">
      <TaskTemplateModal
        open={isModalOpen} mode={modalMode} template={editingTemplate}
        submitting={submitting} onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTemplate}
      />

      {/* ── Assignment Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="font-semibold text-gray-900">Nueva asignación</p>
                <p className="text-sm text-gray-500">{drawerTemplate?.title ?? "Seleccioná una plantilla"}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {!drawerTemplate && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Plantilla</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => setDrawerTemplate(templates.find((t) => t.id === e.target.value) ?? null)}
                  >
                    <option value="">Elegí una plantilla...</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Colaborador</label>
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Elegí un colaborador...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha límite</label>
                <input type="date" value={dueDate} min={today}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Instrucciones <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  rows={4} placeholder="Instrucciones específicas para esta tarea..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="border-t p-4 flex gap-3">
              <button onClick={handleAssign}
                disabled={!drawerTemplate || !selectedUserId || !dueDate || assigning}
                className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-40 hover:opacity-90">
                {assigning ? "Asignando..." : "Confirmar asignación"}
              </button>
              <button onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
          {(["board", "templates"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "board" ? "Tablero" : "Plantillas"}
            </button>
          ))}
        </div>
        <button onClick={() => openDrawer()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90">
          <Plus size={15} /> Nueva asignación
        </button>
      </div>

      {(error || templatesError) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} />
          {error || templatesError}
        </div>
      )}

      {/* ── Board Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "board" && (
        <>
          {/* Stats strip */}
          <div className="mb-5 flex flex-wrap gap-3">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 shadow-sm">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${col.countBg} ${col.countText}`}>
                  {tasksByStatus[col.id].length}
                </span>
                <span className="text-sm text-gray-600">{col.label}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando tareas...
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
                {COLUMNS.map((col) => (
                  <KanbanColumn key={col.id} col={col} tasks={tasksByStatus[col.id]} titleFor={titleFor} />
                ))}
              </div>
              {/* Mobile */}
              <div className="lg:hidden">
                <div className="mb-3 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                  {COLUMNS.map((col) => (
                    <button key={col.id} onClick={() => setMobileCol(col.id)}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${mobileCol === col.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500"}`}>
                      {col.label} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${col.countBg} ${col.countText}`}>{tasksByStatus[col.id].length}</span>
                    </button>
                  ))}
                </div>
                {COLUMNS.filter((c) => c.id === mobileCol).map((col) => (
                  <KanbanColumn key={col.id} col={col} tasks={tasksByStatus[col.id]} titleFor={titleFor} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Templates Tab ──────────────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{templates.length} plantilla{templates.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => { setModalMode("create"); setEditingTemplate(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100">
              <Plus size={13} /> Nueva plantilla
            </button>
          </div>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              <Loader2 size={16} className="mr-2 animate-spin" /> Cargando...
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-14 text-center">
              <ClipboardList size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No hay plantillas todavía</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t}
                  onEdit={() => { setModalMode("edit"); setEditingTemplate(t); setIsModalOpen(true); }}
                  onDelete={async () => {
                    if (!confirm(`¿Eliminar "${t.title}"?`)) return;
                    await removeTemplate(t.id);
                  }}
                  onAssign={() => openDrawer(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
