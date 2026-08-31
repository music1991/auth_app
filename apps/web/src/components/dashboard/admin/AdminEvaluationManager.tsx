"use client";

import { AdminUser, EvaluationResultRow, EvaluationTemplateItem, NewEvaluationFormData } from "@/types";
import { INITIAL_EVALUATION_FORM } from "@/lib/constants";
import { buildAssignmentUsers } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EvaluationCard } from "../EvaluationCard";
import { CreateEvaluationForm } from "./CreateEvaluationForm";
import { EvaluationResultsView } from "./EvaluationResultsView";
import { ManageAssignmentsModal } from "./ManageAssignmentsModal";

type AdminEvaluationsTab = "templates" | "results";

const EVALUATIONS_TABS: { id: AdminEvaluationsTab; label: string }[] = [
  { id: "templates", label: "Plantillas" },
  { id: "results", label: "Resultados" },
];

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

  const [activeTab, setActiveTab] = useState<AdminEvaluationsTab>("templates");
  const [resultsTemplateId, setResultsTemplateId] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResultRow[]>([]);

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
      if (!response.ok) throw new Error("Error al cargar plantillas");
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch {
      toast.error("No se pudieron cargar las evaluaciones. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch("/api/dashboard/admin/users");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUsers(Array.isArray(data) ? data.filter((u: AdminUser) => u.role === "user") : []);
    } catch {
      toast.error("No se pudieron cargar los usuarios.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAssignedUsers = async (evaluationId: string) => {
    try {
      setAssignedLoading(true);
      const res = await fetch(`/api/dashboard/admin/evaluations/?templateId=${evaluationId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssignedUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los usuarios asignados.");
      setAssignedUsers([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  const loadResults = async (templateId: string) => {
    try {
      setResultsLoading(true);
      const res = await fetch(
        `/api/dashboard/admin/evaluations?templateId=${templateId}&results=1`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvaluationResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los resultados. Intentá de nuevo.");
      setEvaluationResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const viewResults = (templateId: string) => {
    setActiveTab("results");
    setResultsTemplateId(templateId);
    void loadResults(templateId);
  };

  const selectResultsTemplate = (templateId: string) => {
    setResultsTemplateId(templateId);
    void loadResults(templateId);
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
        body: JSON.stringify({ ...newEvaluation, dueDate: newEvaluation.dueDate || null }),
      });
      if (!response.ok) throw new Error();
      toast.success("Plantilla creada correctamente.");
      resetCreateForm();
      await loadTemplates();
    } catch {
      toast.error("No se pudo crear la plantilla. Intentá de nuevo.");
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
      toast.success("Evaluación publicada.");
      await loadTemplates();
    } catch {
      toast.error("No se pudo publicar la evaluación.");
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
      toast.success(`${selectedUserIds.length} usuario${selectedUserIds.length > 1 ? "s" : ""} asignado${selectedUserIds.length > 1 ? "s" : ""}.`);
      setSelectedUserIds([]);
      await Promise.all([loadAssignedUsers(selectedEvaluationId), loadTemplates()]);
    } catch {
      toast.error("No se pudo realizar la asignación. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const unassignUser = async (userId: string) => {
    try {
      const res = await fetch("/api/dashboard/admin/evaluations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedEvaluationId, userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "No se pudo desasignar al usuario.");
        return;
      }
      toast.success("Usuario desasignado.");
      setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
      await loadTemplates();
    } catch {
      toast.error("Error al desasignar. Intentá de nuevo.");
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
      <div className="flex w-full rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm">
        {EVALUATIONS_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "templates" ? (
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
                onViewResults={viewResults}
              />
            ))}
          </div>
        </div>
      ) : (
        <EvaluationResultsView
          templates={evaluations}
          selectedTemplateId={resultsTemplateId}
          onSelectTemplate={selectResultsTemplate}
          results={evaluationResults}
          loading={resultsLoading}
        />
      )}

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