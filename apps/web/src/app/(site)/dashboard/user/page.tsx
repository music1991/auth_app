"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, TrendingUp } from "lucide-react";
import UserTasksPanel from "@/components/dashboard/user/UserTasksPanel";
import UserEvaluationsPanel from "@/components/dashboard/user/UserEvaluationsPanel";
import UserPerformanceDashboard from "@/components/dashboard/user/UserPerformanceDashboard";

const TABS = [
  { id: "tasks", label: "Mis tareas", icon: ClipboardList },
  { id: "evaluations", label: "Evaluaciones", icon: BarChart3 },
  { id: "performance", label: "Mi desempeño", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-3xl font-bold text-transparent">
            Mi Panel
          </h1>
          <p className="mt-1 text-gray-600">Consulta tus tareas y completa tus evaluaciones</p>
        </div>

        <div className="mb-8">
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all duration-300 ${
                  activeTab === id
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm">
          {activeTab === "tasks" && <UserTasksPanel />}
          {activeTab === "evaluations" && <UserEvaluationsPanel />}
          {activeTab === "performance" && <UserPerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
