"use client";

import { useEffect, useState } from "react";
import type { TaskTemplate, TaskTemplatePayload } from "@/hooks/useTaskTemplates";

interface TaskTemplateModalProps {
  open: boolean;
  mode: "create" | "edit";
  template?: TaskTemplate | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskTemplatePayload) => Promise<void>;
}

const defaultForm: TaskTemplatePayload = {
  title: "",
  description: "",
  type: "course",
  estimatedHours: 1,
  requirements: [""],
};

export default function TaskTemplateModal({
  open,
  mode,
  template,
  submitting = false,
  onClose,
  onSubmit,
}: TaskTemplateModalProps) {
  const [form, setForm] = useState<TaskTemplatePayload>(defaultForm);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && template) {
      setForm({
        title: template.title,
        description: template.description,
        type: template.type,
        estimatedHours: template.estimatedHours,
        requirements:
          template.requirements?.length > 0 ? template.requirements : [""],
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, mode, template]);

  if (!open) return null;

  const updateRequirement = (index: number, value: string) => {
    setForm((prev) => {
      const requirements = [...prev.requirements];
      requirements[index] = value;
      return { ...prev, requirements };
    });
  };

  const addRequirement = () => {
    setForm((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index: number) => {
    setForm((prev) => {
      const requirements = prev.requirements.filter((_, i) => i !== index);
      return {
        ...prev,
        requirements: requirements.length ? requirements : [""],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: TaskTemplatePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      estimatedHours: Number(form.estimatedHours),
      requirements: form.requirements.map((r) => r.trim()).filter(Boolean),
    };

    await onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">
            {mode === "create" ? "Nueva plantilla" : "Editar plantilla"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="h-24 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as TaskTemplatePayload["type"],
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="course">Curso</option>
                <option value="report">Reporte</option>
                <option value="project">Proyecto</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Horas estimadas
              </label>
              <input
                type="number"
                min={1}
                value={form.estimatedHours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estimatedHours: Number(e.target.value),
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Requisitos
              </label>
              <button
                type="button"
                onClick={addRequirement}
                className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-2">
              {form.requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder={`Requisito ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="rounded bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting
                ? "Guardando..."
                : mode === "create"
                ? "Crear plantilla"
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}