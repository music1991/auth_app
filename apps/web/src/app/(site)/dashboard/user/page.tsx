"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, GraduationCap, TrendingUp } from "lucide-react";
import UserTasksPanel from "@/components/dashboard/user/UserTasksPanel";
import UserEvaluationsPanel from "@/components/dashboard/user/UserEvaluationsPanel";
import UserPerformanceDashboard from "@/components/dashboard/user/UserPerformanceDashboard";
import UserTrainingPanel from "@/components/dashboard/user/UserTrainingPanel";

const TABS = [
  { id: "tasks",       label: "Mis tareas",   icon: ClipboardList },
  { id: "evaluations", label: "Evaluaciones", icon: BarChart3 },
  { id: "training",    label: "Formación",    icon: GraduationCap },
  { id: "performance", label: "Mi desempeño", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-3xl font-bold text-transparent">
            Mi Panel
          </h1>
          <p className="mt-1 text-gray-600">Consultá tus tareas, evaluaciones y formación</p>
        </div>

        {/* Tab bar — horizontal scroll en mobile */}
        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-full rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm sm:min-w-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:px-6 sm:py-3 ${
                  activeTab === id
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          {activeTab === "tasks"       && <UserTasksPanel />}
          {activeTab === "evaluations" && <UserEvaluationsPanel />}
          {activeTab === "training"    && <UserTrainingPanel />}
          {activeTab === "performance" && <UserPerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
