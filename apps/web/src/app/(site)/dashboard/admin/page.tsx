"use client";

import { useState } from "react";
import { Users, ClipboardList, BarChart3, Shield } from "lucide-react";
import AdminStats from "@/components/dashboard/AdminStats";
import AdminUserManagement from "@/components/dashboard/AdminUserManagement";
import AdminTaskAssignment from "@/components/dashboard/AdminTaskAssignment";
import AdminEvaluationManager from "@/components/dashboard/AdminEvaluationManager";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", name: "User Management", icon: Users },
    { id: "tasks", name: "Task Assignment", icon: ClipboardList },
    { id: "evaluations", name: "Evaluations", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-600">Manage users, tasks, and evaluations</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-sm text-gray-600">Administrator</p>
                <p className="font-semibold text-gray-900">Sebastian</p>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Shield size={14} />
                Admin Mode
              </div>
            </div>
          </div>
        </div>

{/*         <AdminStats /> */}

        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200 inline-flex">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  <IconComponent size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60">
          {activeTab === "users" && <AdminUserManagement />}
          {activeTab === "tasks" && <AdminTaskAssignment />}
          {activeTab === "evaluations" && <AdminEvaluationManager />}
        </div>
      </div>
    </div>
  );
}
