/* "use client";

import { useState } from "react";
import { startEvaluation } from "@/services/formServicesApi";

interface Evaluation {
  id: string;
  title: string;
  type: "environment" | "performance" | "skills";
  status: "pending" | "completed" | "expired";
  assignedDate: string;
  dueDate?: string;
  completedDate?: string;
  score?: number;
  maxScore?: number;
}

export default function UserEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([
    {
      id: "1",
      title: "Evaluación de Ambiente Laboral Q1 2024",
      type: "environment",
      status: "pending",
      assignedDate: "2024-01-15",
      dueDate: "2024-02-15",
    },
    {
      id: "2",
      title: "Evaluación de Habilidades Técnicas",
      type: "skills",
      status: "completed",
      assignedDate: "2024-01-10",
      completedDate: "2024-01-20",
      score: 85,
      maxScore: 100,
    },
    {
      id: "3",
      title: "Evaluación de Desempeño Anual",
      type: "performance",
      status: "completed",
      assignedDate: "2023-12-01",
      completedDate: "2023-12-15",
      score: 92,
      maxScore: 100,
    },
  ]);

  const getTypeColor = (type: Evaluation["type"]) => {
    switch (type) {
      case "environment": return "bg-purple-100 text-purple-800";
      case "performance": return "bg-blue-100 text-blue-800";
      case "skills": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: Evaluation["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "expired": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatusToStart = (evaluationId: string) => {
   // startEvaluation(evaluationId)
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Mis Evaluaciones</h2>

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
                {evaluation.status === "pending" && "Pendiente"}
                {evaluation.status === "completed" && "Completada"}
                {evaluation.status === "expired" && "Expirada"}
              </span>
            </div>

            <h3 className="font-semibold mb-2">{evaluation.title}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>Asignada: {new Date(evaluation.assignedDate).toLocaleDateString()}</p>
              {evaluation.dueDate && (
                <p>Vence: {new Date(evaluation.dueDate).toLocaleDateString()}</p>
              )}
              {evaluation.completedDate && (
                <p>Completada: {new Date(evaluation.completedDate).toLocaleDateString()}</p>
              )}
              {evaluation.score !== undefined && (
                <p className="font-semibold">
                  Calificación: {evaluation.score}/{evaluation.maxScore}
                </p>
              )}
            </div>

            <div className="mt-4">
              {evaluation.status === "pending" && (
                <button
                  onClick={() => handleUpdateStatusToStart(evaluation.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium"
                >
                  Realizar Evaluación
                </button>
              )}
              {evaluation.status === "completed" && (
                <button
                  onClick={() => alert(`Ver resultados de: ${evaluation.id}`)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-medium"
                >
                  Ver Resultados
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {evaluations.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <span className="text-4xl mb-2 block">📊</span>
          <p>No hay evaluaciones asignadas</p>
        </div>
      )}
    </div>
  );
} */