"use client";

import { useEffect, useState } from "react";

type EvaluationType = "environment" | "performance" | "skills";
type EvaluationStatus = "draft" | "active" | "completed";

interface EvaluationTemplateItem {
  id: string;
  title: string;
  description: string;
  type: EvaluationType;
  status: EvaluationStatus;
  createdDate: string;
  dueDate: string | null;
  assignedUsers: number;
  responses: number;
  completionRate: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  verified: boolean;
}

export default function AdminEvaluationManager() {
  // 1. ESTADOS (Todos en la raíz del componente)
  const [evaluations, setEvaluations] = useState<EvaluationTemplateItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");

  const [newEvaluation, setNewEvaluation] = useState({
    title: "",
    description: "",
    type: "environment" as EvaluationType,
    dueDate: "",
  });

  // 2. EFECTOS
  useEffect(() => {
    loadEvaluations();
  }, []);

  // 3. FUNCIONES DE CARGA
  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/admin/evaluations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error cargando evaluaciones");
      setEvaluations(data.evaluations || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch("/api/dashboard/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error cargando usuarios");
      const onlyUsers = Array.isArray(data) ? data.filter((u) => u.role === "user") : [];
      setUsers(onlyUsers);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    } finally {
      setUsersLoading(false);
    }
  };

  // 4. HANDLERS
  const openAssignModal = async (evaluationId: string, dueDate?: string | null) => {
    setSelectedEvaluationId(evaluationId);
    setSelectedUserIds([]);
    setAssignDueDate(dueDate || "");
    setShowAssignModal(true);
    await loadUsers(); // Cargamos usuarios al abrir el modal
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const createEvaluation = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/dashboard/admin/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-template",
          data: { ...newEvaluation, dueDate: newEvaluation.dueDate || null },
        }),
      });
      if (!response.ok) throw new Error("Error al crear");
      setShowCreateForm(false);
      setNewEvaluation({ title: "", description: "", type: "environment", dueDate: "" });
      await loadEvaluations();
    } catch (error) {
      alert("Error al crear la evaluación");
    } finally {
      setSubmitting(false);
    }
  };

  const assignEvaluation = async () => {
    if (!selectedEvaluationId || selectedUserIds.length === 0) return;
    try {
      setSubmitting(true);
      const response = await fetch("/api/dashboard/admin/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-template",
          data: { templateId: selectedEvaluationId, userIds: selectedUserIds, dueDate: assignDueDate || null },
        }),
      });
      if (!response.ok) throw new Error("Error al asignar");
      setShowAssignModal(false);
      await loadEvaluations();
    } catch (error) {
      alert("Error al asignar");
    } finally {
      setSubmitting(false);
    }
  };

  const publishEvaluation = async (id: string) => {
    try {
      setSubmitting(true);
      await fetch("/api/dashboard/admin/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish-template", data: { templateId: id } }),
      });
      await loadEvaluations();
    } catch (error) {
      alert("Error al publicar");
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers de Estilo
  const getStatusColor = (status: EvaluationStatus) => {
    const colors = { draft: "bg-gray-100 text-gray-800", active: "bg-green-100 text-green-800", completed: "bg-blue-100 text-blue-800" };
    return colors[status] || colors.draft;
  };

  const getTypeColor = (type: EvaluationType) => {
    const colors = { environment: "bg-purple-100 text-purple-800", performance: "bg-blue-100 text-blue-800", skills: "bg-green-100 text-green-800" };
    return colors[type] || colors.environment;
  };

  if (loading) return <div className="p-6 text-center">Cargando evaluaciones...</div>;

  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gestión de Evaluaciones</h2>
          <button
            className="rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
            onClick={() => setShowCreateForm(true)}
          >
            + Nueva Evaluación
          </button>
        </div>

        {/* FORMULARIO DE CREACIÓN */}
        {showCreateForm && (
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Crear Nueva Evaluación</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Título"
                className="rounded-md border p-2"
                value={newEvaluation.title}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, title: e.target.value })}
              />
              <select
                className="rounded-md border p-2"
                value={newEvaluation.type}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, type: e.target.value as EvaluationType })}
              >
                <option value="environment">Ambiente Laboral</option>
                <option value="performance">Desempeño</option>
                <option value="skills">Habilidades</option>
              </select>
              <textarea
                placeholder="Descripción"
                className="md:col-span-2 rounded-md border p-2 h-20"
                value={newEvaluation.description}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, description: e.target.value })}
              />
              <input
                type="date"
                className="rounded-md border p-2"
                value={newEvaluation.dueDate}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, dueDate: e.target.value })}
              />
              <div className="flex gap-2 items-end">
                <button onClick={createEvaluation} disabled={submitting} className="bg-green-500 text-white px-4 py-2 rounded">
                  {submitting ? "Creando..." : "Guardar"}
                </button>
                <button onClick={() => setShowCreateForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LISTADO DE EVALUACIONES */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((ev) => (
            <div key={ev.id} className="rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between mb-2">
                <span className={`px-2 py-1 text-xs rounded ${getTypeColor(ev.type)}`}>{ev.type}</span>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ev.status)}`}>{ev.status}</span>
              </div>
              <h3 className="font-bold mb-2">{ev.title}</h3>
              <div className="text-sm text-gray-500 mb-4">
                <p>Usuarios: {ev.assignedUsers}</p>
                <p>Progreso: {ev.completionRate}%</p>
              </div>
              <div className="flex gap-2">
                {ev.status === "draft" && (
                  <button onClick={() => publishEvaluation(ev.id)} className="flex-1 bg-green-500 text-white text-xs py-2 rounded">Publicar</button>
                )}
                <button onClick={() => openAssignModal(ev.id, ev.dueDate)} className="flex-1 bg-blue-500 text-white text-xs py-2 rounded">Asignar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE ASIGNACIÓN */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">Asignar Evaluación</h3>
              <button onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="date"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                {usersLoading ? <p>Cargando usuarios...</p> : users.map(user => (
                  <label key={user.id} className="flex justify-between p-2 hover:bg-gray-50 border-b last:border-0 cursor-pointer">
                    <span>{user.name} ({user.email})</span>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAssignModal(false)} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
                <button 
                  onClick={assignEvaluation} 
                  disabled={submitting || selectedUserIds.length === 0} 
                  className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {submitting ? "Asignando..." : "Confirmar Asignación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
