"use client";

import { useEffect, useState, useRef } from "react";
import type { TaskTemplate, TaskTemplatePayload } from "@/hooks/useTaskTemplates";
import { resourceApi } from "@/services/resourceApi";

interface TaskTemplateModalProps {
  open: boolean;
  mode: "create" | "edit";
  template?: TaskTemplate | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskTemplatePayload) => Promise<void>;
}

interface PendingResource {
  title: string;
  type: "pdf" | "link";
  file?: File;
  url?: string;
}

// Interfaz para los recursos que vienen de la DB
interface ExistingResource {
  id: number;
  title: string;
  url: string;
  type: string;
}

const defaultForm: TaskTemplatePayload = {
  title: "",
  description: "",
  type: "course",
  estimatedHours: 1,
  requirements: [], // Aquí guardaremos los IDs
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
  const [dbResources, setDbResources] = useState<ExistingResource[]>([]);
  const [selectedDbIds, setSelectedDbIds] = useState<number[]>([]);
  const [pendingResources, setPendingResources] = useState<PendingResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar recursos de la base de datos al abrir el modal
  useEffect(() => {
    if (!open) return;

    const fetchResources = async () => {
      const res = await resourceApi.getAll();
      if (res.success) setDbResources(res.data);
    };

    fetchResources();

    if (mode === "edit" && template) {
      setForm({ ...template, requirements: template.requirements || [] });
      // Si requirements ya tiene IDs, los marcamos como seleccionados
      setSelectedDbIds(template.requirements.map(Number));
    } else {
      setForm(defaultForm);
      setSelectedDbIds([]);
      setPendingResources([]);
    }
  }, [open, mode, template]);

  if (!open) return null;

  // --- LÓGICA DE SELECCIÓN Y CARGA ---

  const toggleExistingResource = (id: number) => {
    setSelectedDbIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setPendingResources(prev => [...prev, { title: selectedFile.name, type: "pdf", file: selectedFile }]);
    }
  };

  const addLinkResource = () => {
    setPendingResources(prev => [...prev, { title: "Nuevo enlace", type: "link", url: "" }]);
  };

  const removePendingResource = (index: number) => {
    setPendingResources(prev => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsUploading(true);

  try {
    let newResourceIds: string[] = [];

    // 1. Si hay PDF o Link nuevo, se guardan en la tabla 'resources' de Node
    if (pendingResources.length > 0) {
      newResourceIds = await Promise.all(
        pendingResources.map(async (res) => {
          // El link se envía aquí; Node lo guardará en la DB y devolverá su ID
          const result = await resourceApi.create({
            title: res.title || (res.type === 'link' ? "Enlace externo" : "Documento"),
            type: res.type,
            file: res.file,
            url: res.url, // Aquí viaja el link
          });

          if (!result.success) throw new Error(result.message);
          
          // Convertimos el ID a string para que coincida con el tipo de la interfaz
          return String(result.data.id); 
        })
      );
    }

    // 2. Combinamos IDs seleccionados del Combo (convertidos a string) + IDs nuevos
    const selectedIdsStr = selectedDbIds.map(id => String(id));
    const finalResourceIds = Array.from(new Set([
      ...selectedIdsStr, 
      ...newResourceIds
    ])).filter(Boolean);

    // 3. Payload final (Sin errores de tipo)
    const payload: TaskTemplatePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      estimatedHours: Number(form.estimatedHours),
      requirements: finalResourceIds, // Ahora es string[] y TS estará feliz
    };

    await onSubmit(payload);
    onClose();

  } catch (error: any) {
    console.error("❌ Error:", error);
    alert(error.message || "Hubo un problema al procesar los recursos");
  } finally {
    setIsUploading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{mode === "create" ? "Nueva plantilla" : "Editar plantilla"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
          {/* Inputs básicos */}
          <input 
            placeholder="Título" value={form.title} required
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full rounded-md border p-2" 
          />
          <textarea 
            placeholder="Descripción" value={form.description} required
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full rounded-md border p-2 h-20" 
          />

          {/* Selector de Recursos Existentes */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar recursos existentes</label>
            <select 
              className="w-full rounded-md border p-2 mb-2"
              onChange={(e) => toggleExistingResource(Number(e.target.value))}
              value=""
            >
              <option value="" disabled>Selecciona un recurso guardado...</option>
              {dbResources.map(r => (
                <option key={r.id} value={r.id} disabled={selectedDbIds.includes(r.id)}>
                  {r.title} ({r.type})
                </option>
              ))}
            </select>

            {/* Chips de recursos seleccionados */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDbIds.map(id => {
                const res = dbResources.find(r => r.id === id);
                return (
                  <div key={id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-200">
                    <span>{res?.title || `ID: ${id}`}</span>
                    <button type="button" onClick={() => toggleExistingResource(id)} className="font-bold">✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carga de nuevos recursos */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Cargar nuevos (PDF o Link)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-100 p-1 rounded">+ PDF</button>
                <button type="button" onClick={addLinkResource} className="text-xs bg-gray-100 p-1 rounded">+ Link</button>
              </div>
              <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleFileChange} />
            </div>

            <div className="space-y-2">
              {pendingResources.map((res, i) => (
                <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                  <span className="text-xs uppercase font-bold">{res.type}</span>
                  {res.type === 'link' ? (
                    <input 
                      placeholder="URL..." value={res.url} required
                      onChange={e => {
                        const newRes = [...pendingResources];
                        newRes[i].url = e.target.value;
                        setPendingResources(newRes);
                      }}
                      className="flex-1 text-sm bg-transparent border-b" 
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate">{res.file?.name}</span>
                  )}
                  <button type="button" onClick={() => removePendingResource(i)} className="text-red-400">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
            <button 
              type="submit" disabled={isUploading || submitting}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {isUploading ? "Subiendo..." : "Guardar plantilla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
