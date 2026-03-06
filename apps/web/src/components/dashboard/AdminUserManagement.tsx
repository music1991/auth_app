"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, UserPlus, CheckCircle2, XCircle, BarChart3, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: string | null;
  lastSeen: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
  productivityScore: number;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usamos la ruta de admin que configuramos con métricas
      const res = await fetch("/api/users?withMetrics=1", { cache: "no-store" });
      
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
      
      const data = await res.json();
      setUsers(data);
      if (data.length > 0 && !selectedUserId) setSelectedUserId(data[0].id);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const selectedUser = useMemo(() => 
    users.find((u) => u.id === selectedUserId) || null
  , [users, selectedUserId]);

  const getStatusUI = (status: User["status"]) => {
    const isActive = status === "active";
    return {
      bg: isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
      dot: isActive ? "bg-green-500" : "bg-gray-400",
      label: isActive ? "En línea" : "Desconectado"
    };
  };

  const formatDate = (val: string | null) => 
    val ? new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—";

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-gray-500 animate-pulse">Sincronizando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm">Monitorea la actividad y rendimiento de tu equipo.</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm">
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: LISTA */}
        <div className="lg:col-span-1 space-y-3 overflow-y-auto max-h-[700px] pr-2">
          {users.map((user) => {
            const ui = getStatusUI(user.status);
            const progress = user.tasksAssigned > 0 
              ? Math.round((user.tasksCompleted / user.tasksAssigned) * 100) 
              : 0;

            return (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`group relative border rounded-2xl p-4 cursor-pointer transition-all ${
                  selectedUserId === user.id 
                    ? "bg-white border-green-500 shadow-md ring-1 ring-green-500" 
                    : "bg-white border-gray-200 hover:border-green-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{user.name} {user.lastName}</h3>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ui.bg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ui.dot}`} />
                    {ui.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Productividad</span>
                    <span className="font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${progress > 70 ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: DETALLES */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm sticky top-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.name} {selectedUser.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">{selectedUser.email}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-tighter">{selectedUser.role}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <Trash2 size={20} />
                  </button>
                  <button className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm hover:bg-green-700 transition-all">
                    Enviar Mensaje
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Estadísticas de Trabajo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <p className="text-blue-600 text-xs font-medium mb-1">Tareas Totales</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedUser.tasksAssigned}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                      <p className="text-green-600 text-xs font-medium mb-1">Completadas</p>
                      <p className="text-2xl font-bold text-green-900">{selectedUser.tasksCompleted}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-purple-600 text-xs font-medium">Score de Productividad</p>
                      <BarChart3 size={16} className="text-purple-400" />
                    </div>
                    <p className="text-3xl font-black text-purple-900">{selectedUser.productivityScore}<span className="text-sm font-normal text-purple-500">/100</span></p>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Último Login</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedUser.lastLogin)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                        <Send size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Visto por última vez</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedUser.lastSeen)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                     <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all">
                       Asignar Nueva Tarea
                     </button>
                     <button className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all">
                       Descargar Reporte Mensual
                     </button>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                 <Loader2 size={32} className="text-gray-300 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Selecciona un miembro</h3>
              <p className="text-gray-500 text-sm max-w-xs">Haz clic en un usuario de la lista de la izquierda para ver su rendimiento detallado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}