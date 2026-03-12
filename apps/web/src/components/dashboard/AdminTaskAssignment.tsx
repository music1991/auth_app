"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useTaskTemplates,
  type TaskTemplate,
  type TaskTemplatePayload,
} from "@/hooks/useTaskTemplates";
import TaskTemplateModal from "./tasks/TaskTemplateModal";

type AssignedTaskStatus = "pending" | "in-progress" | "completed";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  verified: boolean;
}

interface AssignedTask {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  assignedDate: string;
  dueDate: string;
  status: AssignedTaskStatus;
}

export default function AdminTaskAssignment() {
  const {
    templates: taskTemplates,
    loading: templatesLoading,
    submitting,
    error: templatesError,
    createTemplate,
    editTemplate,
    removeTemplate,
  } = useTaskTemplates();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);

        const res = await fetch("/api/users", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error loading users");
        }

        const onlyUsers = Array.isArray(data)
          ? data.filter((u) => u.role === "user")
          : [];

        setUsers(onlyUsers);
      } catch (err) {
        setUsersError(err instanceof Error ? err.message : "Error loading users");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: TaskTemplate) => {
    setModalMode("edit");
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const resetAssignmentForm = () => {
    setShowAssignmentForm(false);
    setSelectedUserId("");
    setDueDate("");
    setInstructions("");
  };

  const handleSubmitTemplate = async (data: TaskTemplatePayload) => {
    if (modalMode === "create") {
      await createTemplate(data);
      return;
    }

    if (editingTemplate) {
      await editTemplate(editingTemplate.id, data);

      setSelectedTemplate((prev) =>
        prev?.id === editingTemplate.id ? { ...prev, ...data } : prev
      );
    }
  };

  const handleDeleteTemplate = async (template: TaskTemplate) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la plantilla "${template.title}"?`
    );

    if (!confirmed) return;

    await removeTemplate(template.id);

    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      setShowAssignmentForm(false);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTemplate || !selectedUserId || !dueDate) return;

    try {
      setAssigning(true);

      const res = await fetch("/api/dashboard/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "assign-task",
          data: {
            templateId: selectedTemplate.id,
            userId: selectedUserId,
            title: selectedTemplate.title,
            description: selectedTemplate.description,
            dueDate,
            details: {
              instructions,
              requirements: selectedTemplate.requirements,
              estimatedHours: selectedTemplate.estimatedHours,
              type: selectedTemplate.type,
            },
          },
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error assigning task");
      }

      setAssignedTasks((prev) => [
        {
          id: result.taskId,
          templateId: selectedTemplate.id,
          userId: selectedUserId,
          userName: selectedUser?.name || "Usuario",
          assignedDate: new Date().toISOString().split("T")[0],
          dueDate,
          status: "pending",
        },
        ...prev,
      ]);

      resetAssignmentForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error assigning task");
    } finally {
      setAssigning(false);
    }
  };

  const getTypeIcon = (type: TaskTemplate["type"]) => {
    switch (type) {
      case "course":
        return "🎓";
      case "report":
        return "📄";
      case "project":
        return "🚀";
      default:
        return "📌";
    }
  };

  return (
    <div className="p-6">
      <TaskTemplateModal
        open={isModalOpen}
        mode={modalMode}
        template={editingTemplate}
        submitting={submitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTemplate}
      />

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Asignación de Tareas</h2>
        <button
          className="rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
          onClick={openCreateModal}
        >
          + Nueva Plantilla
        </button>
      </div>

      {(templatesError || usersError) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {templatesError || usersError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Plantillas de Tareas</h3>

          {templatesLoading ? (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
              Cargando plantillas...
            </div>
          ) : taskTemplates.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
              No hay plantillas creadas todavía.
            </div>
          ) : (
            <div className="space-y-4">
              {taskTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-green-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowAssignmentForm(false);
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(template.type)}</span>
                      <h4 className="font-semibold">{template.title}</h4>
                    </div>

                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {template.estimatedHours}h
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-gray-600">{template.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {template.requirements.length} requisitos
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(template);
                        }}
                        className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                      >
                        Editar
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                        className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                      >
                        Eliminar
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setShowAssignmentForm(true);
                        }}
                        className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-6">
          {showAssignmentForm && selectedTemplate ? (
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Asignar: {selectedTemplate.title}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Seleccionar Usuario
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    disabled={usersLoading}
                  >
                    <option value="">
                      {usersLoading ? "Cargando usuarios..." : "Selecciona un usuario"}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Instrucciones Adicionales
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="h-20 w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Instrucciones específicas para esta tarea..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAssignTask}
                    disabled={!selectedUserId || !dueDate || assigning}
                    className="rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {assigning ? "Asignando..." : "Confirmar Asignación"}
                  </button>

                  <button
                    onClick={resetAssignmentForm}
                    className="rounded bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : selectedTemplate ? (
            <div>
              <h3 className="mb-4 text-lg font-semibold">Detalles de la Plantilla</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="mt-1 capitalize text-gray-900">{selectedTemplate.type}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Horas Estimadas
                    </label>
                    <p className="mt-1 text-gray-900">{selectedTemplate.estimatedHours}h</p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Requisitos
                  </label>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedTemplate.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssignmentForm(true)}
                    className="w-full rounded bg-green-500 py-2 font-medium text-white hover:bg-green-600"
                  >
                    Asignar esta Tarea
                  </button>
                  <button
                    onClick={() => openEditModal(selectedTemplate)}
                    className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <span className="mb-2 block text-4xl">📋</span>
              <p>Selecciona una plantilla para ver los detalles o asignar</p>
            </div>
          )}
        </div>
      </div>

      {assignedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Tareas Recientemente Asignadas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assignedTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-semibold">
                    {taskTemplates.find((t) => t.id === task.templateId)?.title}
                  </h4>
                  <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                    {task.status}
                  </span>
                </div>
                <p className="mb-2 text-sm text-gray-600">Asignado a: {task.userName}</p>
                <p className="text-xs text-gray-500">
                  Vence: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}