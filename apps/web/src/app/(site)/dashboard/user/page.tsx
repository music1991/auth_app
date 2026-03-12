"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, UserCircle2 } from "lucide-react";
import UserTasksPanel from "@/components/UserTasksPanel";
import UserEvaluationsPanel from "@/components/UserEvaluationsPanel";


export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState("tasks");

  const tabs = [
    { id: "tasks", name: "Mis tareas", icon: ClipboardList },
    { id: "evaluations", name: "Evaluaciones", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <UserCircle2 className="h-8 w-8 text-green-600" />
                <h1 className="bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-3xl font-bold text-transparent">
                  User Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Consulta tus tareas y completa tus evaluaciones
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm text-gray-600">Usuario</p>
                <p className="font-semibold text-gray-900">Sebastian</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <UserCircle2 size={14} />
                User Mode
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  <IconComponent size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm">
          {activeTab === "tasks" && <UserTasksPanel />}
          {activeTab === "evaluations" && <UserEvaluationsPanel />}
        </div>
      </div>
    </div>
  );
}