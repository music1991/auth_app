// components/dashboard/AdminTaskAssignment.tsx
"use client";

import { useState } from "react";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: "course" | "report" | "project";
  estimatedHours: number;
  requirements: string[];
}

interface AssignedTask {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  assignedDate: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
}

export default function AdminTaskAssignment() {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([
    {
      id: "1",
      title: "Curso de React Avanzado",
      description: "Completar curso de React patterns y hooks avanzados",
      type: "course",
      estimatedHours: 20,
      requirements: ["Módulos 1-8", "Proyecto práctico", "Examen final"],
    },
    {
      id: "2",
      title: "Reporte de Progreso Trimestral",
      description: "Documentar logros y métricas del trimestre",
      type: "report",
      estimatedHours: 8,
      requirements: ["Introducción", "Métricas", "Conclusiones"],
    },
    {
      id: "3",
      title: "Optimización de Performance",
      description: "Mejorar rendimiento de aplicación principal",
      type: "project",
      estimatedHours: 40,
      requirements: ["Análisis", "Implementación", "Testing"],
    },
  ]);

  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // Simulación de usuarios disponibles
  const availableUsers = [
    { id: "1", name: "Juan Pérez", email: "juan@empresa.com" },
    { id: "2", name: "María García", email: "maria@empresa.com" },
    { id: "3", name: "Ana Martínez", email: "ana@empresa.com" },
  ];

  const assignTask = (userId: string, dueDate: string) => {
    if (!selectedTemplate) return;

    const newTask: AssignedTask = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      userId,
      userName: availableUsers.find(u => u.id === userId)?.name || "",
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: "pending",
    };

    setAssignedTasks(prev => [newTask, ...prev]);
    setShowAssignmentForm(false);
    setSelectedTemplate(null);
  };

  const getTypeIcon = (type: TaskTemplate["type"]) => {
    switch (type) {
      case "course": return "🎓";
      case "report": return "📄";
      case "project": return "🚀";
      default: return "📌";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Asignación de Tareas</h2>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
          onClick={() => setShowAssignmentForm(true)}
        >
          + Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plantillas de Tareas */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Plantillas de Tareas</h3>
          <div className="space-y-4">
            {taskTemplates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? "ring-2 ring-green-500" : ""
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getTypeIcon(template.type)}</span>
                    <h4 className="font-semibold">{template.title}</h4>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {template.estimatedHours}h
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{template.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {template.requirements.length} requisitos
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                      setShowAssignmentForm(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Asignar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Asignación o Detalles */}
        <div className="bg-gray-50 rounded-lg p-6">
          {showAssignmentForm && selectedTemplate ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Asignar: {selectedTemplate.title}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Usuario
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Selecciona un usuario</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones Adicionales
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    placeholder="Instrucciones específicas para esta tarea..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => assignTask("1", "2024-02-15")} // Valores de ejemplo
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Confirmar Asignación
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignmentForm(false);
                      setSelectedTemplate(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : selectedTemplate ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalles de la Plantilla</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <p className="mt-1 text-gray-900">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="mt-1 text-gray-900 capitalize">{selectedTemplate.type}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Horas Estimadas</label>
                    <p className="mt-1 text-gray-900">{selectedTemplate.estimatedHours}h</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requisitos</label>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {selectedTemplate.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded font-medium"
                >
                  Asignar esta Tarea
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">📋</span>
              <p>Selecciona una plantilla para ver los detalles o asignar</p>
            </div>
          )}
        </div>
      </div>

      {/* Tareas Asignadas */}
      {assignedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Tareas Recientemente Asignadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">
                    {taskTemplates.find(t => t.id === task.templateId)?.title}
                  </h4>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Asignado a: {task.userName}</p>
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