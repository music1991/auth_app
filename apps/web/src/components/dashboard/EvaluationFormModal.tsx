"use client";

import { X, ExternalLink } from "lucide-react";

interface EvaluationFormModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  googleFormId?: string | null;
}

function buildGoogleFormEmbedUrl(formId: string) {
  return `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;
}

function buildGoogleFormViewUrl(formId: string) {
  return `https://docs.google.com/forms/d/e/${formId}/viewform`;
}

export default function EvaluationFormModal({
  open,
  onClose,
  title,
  googleFormId,
}: EvaluationFormModalProps) {
  if (!open) return null;

  const hasForm = Boolean(googleFormId);
  const embedUrl = hasForm ? buildGoogleFormEmbedUrl(googleFormId!) : null;
  const viewUrl = hasForm ? buildGoogleFormViewUrl(googleFormId!) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {title || "Evaluación"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Completa la evaluación en el formulario embebido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {!hasForm ? (
          <div className="flex flex-1 items-center justify-center bg-muted/30 p-8">
            <div className="max-w-md rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-xs">
              <p className="text-base font-medium text-foreground">
                No hay un Google Form configurado
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta evaluación no tiene asociado un formulario para mostrar.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 bg-muted/40">
              <iframe
                src={embedUrl!}
                title={title || "Formulario de evaluación"}
                className="h-full w-full"
              >
                Cargando formulario...
              </iframe>
            </div>
          </>
        )}
      </div>
    </div>
  );
}