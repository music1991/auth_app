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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {title || "Evaluación"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Completa la evaluación en el formulario embebido.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {!hasForm ? (
          <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
            <div className="max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-base font-medium text-gray-900">
                No hay un Google Form configurado
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Esta evaluación no tiene asociado un formulario para mostrar.
              </p>
            </div>
          </div>
        ) : (
          <>
{/*             <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-3">
              <p className="text-sm text-gray-500">
                Si no carga correctamente, puedes abrirlo en una pestaña nueva.
              </p>

              <a
                href={viewUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ExternalLink size={16} />
                Abrir en otra pestaña
              </a>
            </div> */}

            <div className="flex-1 bg-gray-100">
              <iframe
                src={embedUrl!}
                title={title || "Formulario de evaluación"}
                className="h-full w-full"
    /*             frameBorder="0"
                marginHeight={0}
                marginWidth={0} */
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