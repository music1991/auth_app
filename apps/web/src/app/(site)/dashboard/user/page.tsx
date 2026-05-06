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
    <div className="min-h-screen bg-gray-50">
      <div className="px-8 py-8 sm:px-10 lg:px-14">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Mi Panel
          </h1>
          <p className="mt-1 text-gray-600">Consultá tus tareas, evaluaciones y formación</p>
        </div>

        {/* Tab bar */}
        <div className="mb-6">
          <div className="flex w-full rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? "bg-green-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg">
          {activeTab === "tasks"       && <UserTasksPanel />}
          {activeTab === "evaluations" && <UserEvaluationsPanel />}
          {activeTab === "training"    && <UserTrainingPanel />}
          {activeTab === "performance" && <UserPerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
