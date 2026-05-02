"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, GraduationCap, Shield, TrendingUp, Users } from "lucide-react";
import AdminUserManagement from "@/components/dashboard/admin/AdminUserManagement";
import AdminTaskAssignment from "@/components/dashboard/admin/AdminTaskAssignment";
import AdminEvaluationManager from "@/components/dashboard/admin/AdminEvaluationManager";
import AdminPerformanceDashboard from "@/components/dashboard/admin/AdminPerformanceDashboard";
import AdminTrainingManager from "@/components/dashboard/admin/AdminTrainingManager";

const TABS = [
  { id: "users",       label: "Usuarios",   icon: Users },
  { id: "tasks",       label: "Tareas",     icon: ClipboardList },
  { id: "evaluations", label: "Evaluaciones", icon: BarChart3 },
  { id: "training",    label: "Formación",  icon: GraduationCap },
  { id: "performance", label: "Desempeño",  icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-3xl font-bold text-transparent">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-600">Gestioná usuarios, tareas, evaluaciones y formación</p>
          </div>
        </div>

        {/* Tab bar — horizontal scroll en mobile */}
        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-full rounded-2xl border border-gray-200 bg-white/80 p-1 backdrop-blur-sm sm:min-w-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:px-5 sm:py-3 ${
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
          {activeTab === "users"       && <AdminUserManagement />}
          {activeTab === "tasks"       && <AdminTaskAssignment />}
          {activeTab === "evaluations" && <AdminEvaluationManager />}
          {activeTab === "training"    && <AdminTrainingManager />}
          {activeTab === "performance" && <AdminPerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
