"use client";

import { useState } from "react";
import { BarChart3, ClipboardList, GraduationCap, Loader2, Shield, TrendingUp, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
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

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

const EMPTY_FORM: NewUserForm = { name: "", email: "", password: "", role: "user" };

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const closeModal = () => {
    if (creating) return;
    setShowModal(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear usuario");
        return;
      }
      toast.success("Usuario creado correctamente");
      setShowModal(false);
    } catch {
      toast.error("Error de red");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <div className="px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
          <button
            onClick={openModal}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 active:scale-95"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </button>
        </div>

        {/* Tab bar */}
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

        {/* Tab content — no backdrop-blur so fixed drawers aren't trapped */}
        <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg">
          {activeTab === "users"       && <AdminUserManagement />}
          {activeTab === "tasks"       && <AdminTaskAssignment />}
          {activeTab === "evaluations" && <AdminEvaluationManager />}
          {activeTab === "training"    && <AdminTrainingManager />}
          {activeTab === "performance" && <AdminPerformanceDashboard />}
        </div>
      </div>

      {/* New user modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
              <button
                onClick={closeModal}
                disabled={creating}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: María García"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:opacity-60"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
