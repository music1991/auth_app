"use client";

import { useEffect, useState } from "react";

// --- TIPOS ---
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
}

export default function AdminEvaluationManager() {
  // --- ESTADOS ---
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

    const extractGoogleFormId = (url: string) => {
  // Regex para capturar el ID entre /d/ o /d/e/ y el siguiente slash
  const regex = /\/d\/(?:e\/)?([a-zA-Z0-9_-]{40,})\//;
  const match = url.match(regex);
  return match ? match[1] : url; // Si no hay match, devuelve lo que el usuario pegó (por si ya era el ID)
};

  const [newEvaluation, setNewEvaluation] = useState({
    title: "",
    description: "",
    type: "environment" as EvaluationType,
    dueDate: "",
    google_form_id: ""
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  // --- PETICIONES API ---

  // 1. Cargar Plantillas (GET a /evaluation-templates)
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/admin/evaluation-templates");
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error("Error cargando plantillas");
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar Usuarios (GET a /users)
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch("/api/dashboard/admin/users");
      const data = await response.json();
      const onlyUsers = Array.isArray(data) ? data.filter((u) => u.role === "user") : [];
      setUsers(onlyUsers);
    } catch (error) {
      console.error("Error cargando usuarios");
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Crear Plantilla (POST a /evaluation-templates)
  const createTemplate = async () => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/dashboard/admin/evaluation-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvaluation, dueDate: newEvaluation.dueDate || null }),
      });
      if (!response.ok) throw new Error();
      
      setShowCreateForm(false);
      setNewEvaluation({ title: "", description: "", type: "environment", dueDate: "", google_form_id: "" });
      await loadTemplates();
    } catch (error) {
      alert("Error al crear plantilla");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Publicar Plantilla (PUT a /evaluation-templates)
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

  // 5. Asignar Evaluación (POST a /evaluations)
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
          dueDate: assignDueDate || null 
        }),
      });
      if (!response.ok) throw new Error();
      setShowAssignModal(false);
      await loadTemplates(); // Recargamos para ver los nuevos "assignedUsers"
    } catch (error) {
      alert("Error al asignar");
    } finally {
      setSubmitting(false);
    }
  };

  // --- HELPERS ---
  const extractId = (url: string) => {
    const match = url.match(/\/d\/(?:e\/)?([a-zA-Z0-9_-]{40,})\//);
    return match ? match[1] : url;
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Cargando panel...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestor de Evaluaciones</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
        >
          + Nueva Plantilla
        </button>
      </div>

      {/* FORMULARIO CREAR */}
      {showCreateForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold mb-4">Configurar Evaluación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Título" 
              className="border p-2.5 rounded-lg" 
              value={newEvaluation.title}
              onChange={e => setNewEvaluation({...newEvaluation, title: e.target.value})}
            />
            <select 
              className="border p-2.5 rounded-lg" 
              value={newEvaluation.type}
              onChange={e => setNewEvaluation({...newEvaluation, type: e.target.value as EvaluationType})}
            >
              <option value="environment">Clima Laboral</option>
              <option value="performance">Desempeño</option>
              <option value="skills">Skills</option>
            </select>
            <textarea 
              placeholder="Descripción" 
              className="border p-2.5 rounded-lg md:col-span-2 h-20"
              value={newEvaluation.description}
              onChange={e => setNewEvaluation({...newEvaluation, description: e.target.value})}
            />
              <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">ID del Formulario de Google</label>
    <a 
      href="https://forms.new" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors flex items-center gap-1"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
      Crear nuevo formulario
    </a>
  </div>
              <input
                type="text"
                placeholder="ID de Google Form (ej: 1FAIpQLSf...)"
                className="rounded-md border p-2 border-blue-300 focus:ring-2 focus:ring-blue-500"
                value={newEvaluation.google_form_id}
                onChange={(e) => {
                    const rawValue = e.target.value;
                    const cleanedId = extractGoogleFormId(rawValue);
                    setNewEvaluation({ ...newEvaluation, google_form_id: cleanedId });
                  }}
              />
              <span className="text-[10px] text-gray-500 ml-1">
                Copia el ID largo que aparece en la URL de tu formulario.
              </span>
            </div>
            <input 
              type="date" 
              className="border p-2.5 rounded-lg"
              value={newEvaluation.dueDate}
              onChange={e => setNewEvaluation({...newEvaluation, dueDate: e.target.value})}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button onClick={() => setShowCreateForm(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button 
              onClick={createTemplate} 
              disabled={submitting || !newEvaluation.title}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Crear"}
            </button>
          </div>
        </div>
      )}

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluations.map(ev => (
          <div key={ev.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{ev.type}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ev.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{ev.status}</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{ev.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{ev.description}</p>
              
              <div className="flex justify-between border-t border-gray-50 pt-3 mb-4 text-center">
                <div><p className="text-[10px] text-gray-400">Asignados</p><p className="font-bold">{ev.assignedUsers}</p></div>
                <div><p className="text-[10px] text-gray-400">Respuestas</p><p className="font-bold">{ev.responses}</p></div>
                <div><p className="text-[10px] text-gray-400">Progreso</p><p className="font-bold">{ev.completionRate}%</p></div>
              </div>
            </div>

            <div className="flex gap-2">
              {ev.status === "draft" && (
                <button onClick={() => publishTemplate(ev.id)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-500">Publicar</button>
              )}
              <button 
                onClick={() => { setSelectedEvaluationId(ev.id); setShowAssignModal(true); loadUsers(); }} 
                className="flex-1 border text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50"
              >
                Asignar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ASIGNAR */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Enviar Evaluación</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Fecha Límite</label>
                <input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)} className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Seleccionar Usuarios ({selectedUserIds.length})</label>
                <div className="border rounded-lg mt-1 h-60 overflow-y-auto divide-y">
                  {usersLoading ? <p className="p-4 text-center text-xs">Cargando...</p> : users.map(u => (
                    <div key={u.id} onClick={() => toggleUser(u.id)} className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedUserIds.includes(u.id)} readOnly className="rounded border-gray-300 text-indigo-600" />
                      <div><p className="text-sm font-bold text-gray-800">{u.name}</p><p className="text-[10px] text-gray-500">{u.email}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg">Cerrar</button>
              <button 
                onClick={assignEvaluation} 
                disabled={submitting || selectedUserIds.length === 0} 
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {submitting ? "Asginando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
