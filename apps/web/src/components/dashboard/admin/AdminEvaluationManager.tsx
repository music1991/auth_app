"use client";

import { AdminUser, EvaluationTemplateItem, NewEvaluationFormData } from "@/types";
import { INITIAL_EVALUATION_FORM } from "@/lib/constants";
import { buildAssignmentUsers } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { EvaluationCard } from "../EvaluationCard";
import { CreateEvaluationForm } from "./CreateEvaluationForm";
import { ManageAssignmentsModal } from "./ManageAssignmentsModal";

export default function AdminEvaluationManager() {
  const [evaluations, setEvaluations] = useState<EvaluationTemplateItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");

  const [assignedUsers, setAssignedUsers] = useState<AdminUser[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);

  const [newEvaluation, setNewEvaluation] =
    useState<NewEvaluationFormData>(INITIAL_EVALUATION_FORM);

  useEffect(() => {
    loadTemplates();
  }, []);

  const assignmentUsers = useMemo(() => {
    return buildAssignmentUsers(users, assignedUsers, selectedUserIds);
  }, [users, assignedUsers, selectedUserIds]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/admin/evaluation-templates");
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch {
      // silencioso — el estado de evaluations queda vacío
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch("/api/dashboard/admin/users");
      const data = await response.json();
      const onlyUsers = Array.isArray(data)
        ? data.filter((user: AdminUser) => user.role === "user")
        : [];
      setUsers(onlyUsers);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAssignedUsers = async (evaluationId: string) => {
    try {
      setAssignedLoading(true);
      const res = await fetch(`/api/dashboard/admin/evaluations/?templateId=${evaluationId}`);
      const data = await res.json();
      setAssignedUsers(Array.isArray(data) ? data : []);
    } catch {
      setAssignedUsers([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  const updateNewEvaluation = (patch: Partial<NewEvaluationFormData>) => {
    setNewEvaluation((prev) => ({ ...prev, ...patch }));
  };

  const resetCreateForm = () => {
    setNewEvaluation(INITIAL_EVALUATION_FORM);
    setShowCreateForm(false);
  };

  const openAssignmentsModal = async (
    evaluationId: string,
    evaluationDueDate: string | null = null
  ) => {
    setSelectedEvaluationId(evaluationId);
    setSelectedUserIds([]);
    setAssignedUsers([]);

    if (evaluationDueDate !== null) setAssignDueDate(evaluationDueDate);
    else setAssignDueDate("");

    setShowAssignmentsModal(true);

    await Promise.all([
      loadUsers(),
      loadAssignedUsers(evaluationId),
    ]);
  };

  const closeAssignmentsModal = () => {
    setShowAssignmentsModal(false);
    setSelectedEvaluationId(null);
    setSelectedUserIds([]);
    setAssignDueDate("");
    setAssignedUsers([]);
  };

  const createTemplate = async () => {
    try {
      setSubmitting(true);

      const response = await fetch("/api/dashboard/admin/evaluation-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvaluation,
          dueDate: newEvaluation.dueDate || null,
        }),
      });

      if (!response.ok) throw new Error();

      resetCreateForm();
      await loadTemplates();
    } catch (error) {
      alert("Error al crear plantilla");
    } finally {
      setSubmitting(false);
    }
  };

  const publishTemplate = async (templateId: string) => {
    try {
      setSubmitting(true);

      const response = await fetch("/api/dashboard/admin/evaluation-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) throw new Error();

      await loadTemplates();
    } catch (error) {
      alert("Error al publicar");
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
          templateId: selectedEvaluationId,
          userIds: selectedUserIds,
          dueDate: assignDueDate || null,
        }),
      });

      if (!response.ok) throw new Error();

      setSelectedUserIds([]);

      await Promise.all([
        loadAssignedUsers(selectedEvaluationId),
        loadTemplates(),
      ]);
    } catch (error) {
      alert("Error al asignar");
    } finally {
      setSubmitting(false);
    }
  };

  const unassignUser = async (userId: string) => {
    const confirmDelete = confirm("¿Remover este usuario?");
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/dashboard/admin/evaluations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedEvaluationId,
          userId,
        }),
      });

      if (!res.ok) throw new Error();

      setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));

      await loadTemplates();
    } catch (err) {
      alert("Error al desasignar");
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Cargando panel...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestor de Evaluaciones</h2>

        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
        >
          + Nueva Plantilla
        </button>
      </div>

      <CreateEvaluationForm
        open={showCreateForm}
        newEvaluation={newEvaluation}
        submitting={submitting}
        onClose={resetCreateForm}
        onChange={updateNewEvaluation}
        onSubmit={createTemplate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluations.map((evaluation) => (
          <EvaluationCard
            key={evaluation.id}
            evaluation={evaluation}
            onPublish={publishTemplate}
            onManageAssignments={openAssignmentsModal}
          />
        ))}
      </div>

      <ManageAssignmentsModal
        open={showAssignmentsModal}
        users={assignmentUsers}
        usersLoading={usersLoading}
        assignedLoading={assignedLoading}
        selectedUserIds={selectedUserIds}
        assignDueDate={assignDueDate}
        submitting={submitting}
        onClose={closeAssignmentsModal}
        onToggleUser={toggleUser}
        onDueDateChange={setAssignDueDate}
        onAssign={assignEvaluation}
        onUnassign={unassignUser}
      />
    </div>
  );
}