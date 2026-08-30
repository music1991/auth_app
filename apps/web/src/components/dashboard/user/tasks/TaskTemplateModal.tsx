"use client";

import { useEffect, useState, useRef } from "react";
import type { TaskTemplate, TaskTemplatePayload } from "@/hooks/useTaskTemplates";
import { resourceApi } from "@/services/resource";

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
  id: string;
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
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [selectedDbIds, setSelectedDbIds] = useState<string[]>([]);
  const [pendingResources, setPendingResources] = useState<PendingResource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar recursos de la base de datos al abrir el modal
  useEffect(() => {
  if (!open) return;

  const fetchResources = async () => {
    setResourcesLoading(true);
    try {
      // Importante: getAll() debe usar fetch("/api/resources") internamente
      const res = await resourceApi.getAll();

      if (res.success) {
        setDbResources(res.data);
      } else {
        // Si el backend responde con error pero el fetch conectó
        console.error("Error en recursos:", res.message, "URL:", res.api_url);
      }
    } catch (error) {
      // Aquí verás el error que configuramos en el proxy (el API_BASE_URL)
      console.error("❌ Fallo crítico al traer recursos:", error);
      alert(`No se pudo conectar con el backend. Detalle: ${error}`);
    } finally {
      setResourcesLoading(false);
    }
  };

  fetchResources();

  // Los recursos pendientes son solo un buffer de "borrador" mientras el
  // modal está abierto: si no se limpian acá, al reabrir (crear o editar)
  // seguían apareciendo como recién agregados aunque ya se hubieran guardado.
  setPendingResources([]);

  if (mode === "edit" && template) {
    // Aseguramos que requirements sea un array antes de mapear.
    // Los IDs de recursos son UUID (string): NO castear con Number(),
    // porque eso los convierte en NaN y rompe la selección/el guardado.
    const reqs = template.requirements || [];
    setForm({ ...template, requirements: reqs });
    setSelectedDbIds(reqs.map(String));
  } else {
    setForm(defaultForm);
    setSelectedDbIds([]);
  }
}, [open, mode, template]); // Agregué dependencias para evitar warnings de React


  if (!open) return null;

  // --- LÓGICA DE SELECCIÓN Y CARGA ---

  const toggleExistingResource = (id: string) => {
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

    if (pendingResources.length > 0) {
      newResourceIds = await Promise.all(
        pendingResources.map(async (res) => {
          const result = await resourceApi.create({
            title: res.title || (res.type === 'link' ? "Enlace externo" : "Documento"),
            type: res.type,
            file: res.file,
            url: res.url,
          });

          // Si el backend respondió éxito: false
          if (!result.success) {
             throw new Error(result.message || "Error al crear recurso");
          }
          
          return String(result.data.id); 
        })
      );
    }

    const selectedIdsStr = selectedDbIds.map(id => String(id));
    const finalResourceIds = Array.from(new Set([
      ...selectedIdsStr, 
      ...newResourceIds
    ])).filter(Boolean);

    const payload: TaskTemplatePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      estimatedHours: Number(form.estimatedHours),
      requirements: finalResourceIds, 
    };

    await onSubmit(payload);
    onClose();

  } catch (error: any) {
    console.error("❌ Detalle del Error:", error);
    // Aquí verás el mensaje que incluimos en el route.ts (con la API_URL)
    alert(`Error: ${error.message}`);
  } finally {
    setIsUploading(false);
  }
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl bg-card text-card-foreground border border-border shadow-2xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{mode === "create" ? "Nueva plantilla" : "Editar plantilla"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
          {/* Inputs básicos */}
          <input 
            placeholder="Título" value={form.title} required
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" 
          />
          <textarea 
            placeholder="Descripción" value={form.description} required
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground p-2.5 h-24 text-sm outline-none focus:ring-2 focus:ring-ring" 
          />

          {/* Selector de Recursos Existentes */}
          <div className="border-t border-border pt-4">
            <label className="block text-sm font-semibold text-foreground mb-2">Seleccionar recursos existentes</label>
            <select 
              className="w-full rounded-md border border-input bg-background text-foreground p-2.5 mb-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => toggleExistingResource(e.target.value)}
              value=""
            >
              <option value="" disabled className="bg-card text-card-foreground">Selecciona un recurso guardado...</option>
              {dbResources.map(r => (
                <option key={r.id} value={r.id} disabled={selectedDbIds.includes(r.id)} className="bg-card text-card-foreground">
                  {r.title} ({r.type})
                </option>
              ))}
            </select>

            {/* Chips de recursos seleccionados */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDbIds.map(id => {
                const res = dbResources.find(r => r.id === id);
                const label = res?.title ?? (resourcesLoading ? "Cargando..." : "Recurso no disponible");
                return (
                  <div key={id} className="flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-md text-xs border border-green-500/20 font-medium">
                    <span>{label}</span>
                    <button type="button" onClick={() => toggleExistingResource(id)} className="font-bold hover:text-green-900 dark:hover:text-green-100">✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carga de nuevos recursos */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-foreground">Cargar nuevos (PDF o Link)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded font-medium transition-colors">+ PDF</button>
                <button type="button" onClick={addLinkResource} className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded font-medium transition-colors">+ Link</button>
              </div>
              <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleFileChange} />
            </div>

            <div className="space-y-2">
              {pendingResources.map((res, i) => (
                <div key={i} className="flex gap-2 items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                  <span className="text-xs uppercase font-bold text-muted-foreground px-1">{res.type}</span>
                  {res.type === 'link' ? (
                    <input 
                      placeholder="URL..." value={res.url} required
                      onChange={e => {
                        const newRes = [...pendingResources];
                        newRes[i].url = e.target.value;
                        setPendingResources(newRes);
                      }}
                      className="flex-1 text-sm bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none py-0.5" 
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate text-foreground">{res.file?.name}</span>
                  )}
                  <button type="button" onClick={() => removePendingResource(i)} className="text-red-500 hover:text-red-600 font-bold px-1 transition-colors">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors">Cancelar</button>
            <button 
              type="submit" disabled={isUploading || submitting}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              {isUploading ? "Subiendo..." : "Guardar plantilla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
