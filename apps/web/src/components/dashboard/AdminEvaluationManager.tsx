"use client";

import { useState } from "react";

interface Evaluation {
  id: string;
  title: string;
  type: "environment" | "performance" | "skills";
  status: "draft" | "active" | "completed";
  assignedTo: string[];
  createdDate: string;
  dueDate: string;
  responses: number;
  totalUsers: number;
}

export default function AdminEvaluationManager() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([
    {
      id: "1",
      title: "Evaluación de Ambiente Laboral Q1 2024",
      type: "environment",
      status: "active",
      assignedTo: ["user1", "user2", "user3", "user4"],
      createdDate: "2024-01-15",
      dueDate: "2024-02-15",
      responses: 2,
      totalUsers: 4,
    },
    {
      id: "2",
      title: "Evaluación de Habilidades Técnicas",
      type: "skills",
      status: "completed",
      assignedTo: ["user1", "user2", "user3"],
      createdDate: "2024-01-10",
      dueDate: "2024-01-20",
      responses: 3,
      totalUsers: 3,
    },
    {
      id: "3",
      title: "Evaluación de Desempeño Anual",
      type: "performance",
      status: "draft",
      assignedTo: [],
      createdDate: "2024-01-18",
      dueDate: "2024-02-28",
      responses: 0,
      totalUsers: 0,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState({
    title: "",
    type: "environment" as const,
    dueDate: "",
  });

  const createEvaluation = () => {
    const evaluation: Evaluation = {
      id: Date.now().toString(),
      title: newEvaluation.title,
      type: newEvaluation.type,
      status: "draft",
      assignedTo: [],
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: newEvaluation.dueDate,
      responses: 0,
      totalUsers: 0,
    };

    setEvaluations(prev => [evaluation, ...prev]);
    setShowCreateForm(false);
    setNewEvaluation({ title: "", type: "environment", dueDate: "" });
  };

  const getStatusColor = (status: Evaluation["status"]) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: Evaluation["type"]) => {
    switch (type) {
      case "environment": return "bg-purple-100 text-purple-800";
      case "performance": return "bg-blue-100 text-blue-800";
      case "skills": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const publishEvaluation = (evaluationId: string) => {
    setEvaluations(evaluations.map(evalItem =>
      evalItem.id === evaluationId ? { ...evalItem, status: "active" } : evalItem
    ));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestión de Evaluaciones</h2>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
          onClick={() => setShowCreateForm(true)}
        >
          + Nueva Evaluación
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Crear Nueva Evaluación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Evaluación
              </label>
              <input
                type="text"
                value={newEvaluation.title}
                onChange={(e) => setNewEvaluation({...newEvaluation, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Ej: Evaluación de Ambiente Laboral Q1 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evaluación
              </label>
              <select
                value={newEvaluation.type}
                onChange={(e) => setNewEvaluation({...newEvaluation, type: e.target.value as any})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="environment">Ambiente Laboral</option>
                <option value="performance">Desempeño</option>
                <option value="skills">Habilidades</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                value={newEvaluation.dueDate}
                onChange={(e) => setNewEvaluation({...newEvaluation, dueDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-end">
              <div className="flex gap-2">
                <button
                  onClick={createEvaluation}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
                >
                  Crear Evaluación
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluations.map((evaluation) => (
          <div key={evaluation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(evaluation.type)}`}>
                {evaluation.type === "environment" && "Ambiente"}
                {evaluation.type === "performance" && "Desempeño"}
                {evaluation.type === "skills" && "Habilidades"}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                {evaluation.status === "draft" && "Borrador"}
                {evaluation.status === "active" && "Activa"}
                {evaluation.status === "completed" && "Completada"}
              </span>
            </div>

            <h3 className="font-semibold mb-2">{evaluation.title}</h3>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Creada: {new Date(evaluation.createdDate).toLocaleDateString()}</p>
              <p>Vence: {new Date(evaluation.dueDate).toLocaleDateString()}</p>
              <p>Asignada a: {evaluation.assignedTo.length} usuarios</p>
              <p>Respuestas: {evaluation.responses}/{evaluation.totalUsers}</p>
            </div>

            {evaluation.totalUsers > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso de respuestas</span>
                  <span>{Math.round((evaluation.responses / evaluation.totalUsers) * 100)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(evaluation.responses / evaluation.totalUsers) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {evaluation.status === "draft" && (
                <button
                  onClick={() => publishEvaluation(evaluation.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm font-medium"
                >
                  Publicar
                </button>
              )}
              {evaluation.status === "active" && (
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium">
                  Ver Resultados
                </button>
              )}
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {evaluations.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <span className="text-4xl mb-2 block">📊</span>
          <p>No hay evaluaciones creadas</p>
          <button 
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            onClick={() => setShowCreateForm(true)}
          >
            Crear Primera Evaluación
          </button>
        </div>
      )}
    </div>
  );
}