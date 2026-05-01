"use client";

import { useCallback, useEffect, useState } from "react";
import type { TaskType } from "@/types";

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimatedHours: number;
  requirements: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskTemplatePayload {
  title: string;
  description: string;
  type: TaskType;
  estimatedHours: number;
  requirements: string[];
}

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/dashboard/admin/task-templates");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error loading templates");

      setTemplates(data.taskTemplates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = async (data: TaskTemplatePayload) => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/dashboard/admin/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-template", data }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error creating template");

      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating template");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const editTemplate = async (id: string, data: TaskTemplatePayload) => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/dashboard/admin/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-template", data: { id, ...data } }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error updating template");

      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating template");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const removeTemplate = async (id: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/dashboard/admin/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-template", data: { id } }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error deleting template");

      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting template");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    templates,
    loading,
    submitting,
    error,
    loadTemplates,
    createTemplate,
    editTemplate,
    removeTemplate,
  };
}
