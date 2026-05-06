"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, GraduationCap, Shield, TrendingUp, Users } from "lucide-react";
import AdminUserManagement from "@/components/dashboard/admin/AdminUserManagement";
import AdminTaskAssignment from "@/components/dashboard/admin/AdminTaskAssignment";
import AdminEvaluationManager from "@/components/dashboard/admin/AdminEvaluationManager";
import AdminPerformanceDashboard from "@/components/dashboard/admin/AdminPerformanceDashboard";
import AdminTrainingManager from "@/components/dashboard/admin/AdminTrainingManager";

const TABS = [
  { id: "users",       label: "Usuarios",     icon: Users },
  { id: "tasks",       label: "Tareas",       icon: ClipboardList },
  { id: "evaluations", label: "Evaluaciones", icon: BarChart3 },
  { id: "training",    label: "Formación",    icon: GraduationCap },
  { id: "performance", label: "Desempeño",    icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-8 py-8 sm:px-10 lg:px-14">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-600">Gestioná usuarios, tareas, evaluaciones y formación</p>
          </div>
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

        {/* Tab content */}
        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg">
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
