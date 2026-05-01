"use client";

import { useState } from "react";
import { Users, ClipboardList, BarChart3, Shield, TrendingUp } from "lucide-react";
import AdminUserManagement from "@/components/dashboard/admin/AdminUserManagement";
import AdminTaskAssignment from "@/components/dashboard/admin/AdminTaskAssignment";
import AdminEvaluationManager from "@/components/dashboard/admin/AdminEvaluationManager";
import AdminPerformanceDashboard from "@/components/dashboard/admin/AdminPerformanceDashboard";

const TABS = [
  { id: "users", label: "Gestión de Usuarios", icon: Users },
  { id: "tasks", label: "Asignación de Tareas", icon: ClipboardList },
  { id: "evaluations", label: "Evaluaciones", icon: BarChart3 },
  { id: "performance", label: "Desempeño", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-3xl font-bold text-transparent">
              Panel de Administración
            </h1>
            <p className="text-gray-600">Gestiona usuarios, tareas y evaluaciones</p>
          </div>
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
          {activeTab === "users" && <AdminUserManagement />}
          {activeTab === "tasks" && <AdminTaskAssignment />}
          {activeTab === "evaluations" && <AdminEvaluationManager />}
          {activeTab === "performance" && <AdminPerformanceDashboard />}
        </div>
      </div>
    </div>
  );
}
