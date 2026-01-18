"use client";

import { useEffect, useMemo, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: string | null;
  lastSeen: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError(null);
        setLoadingUsers(true);

        const res = await fetch("/api/users?withMetrics=1", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Error cargando usuarios");
        }

        const data: User[] = await res.json();
        if (!alive) return;

        setUsers(data);
        setSelectedUserId((prev) => prev ?? data[0]?.id ?? null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error");
      } finally {
        if (alive) setLoadingUsers(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => u.id === selectedUserId) ?? null;
  }, [users, selectedUserId]);

  const updateUserStatus = async (userId: string, newStatus: User["status"]) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));

    // TODO: cuando tenga endpoint PATCH:
    // const prevUsers = users;
    // const res = await fetch(`/api/admin/users/${userId}/status`, {...})
    // if (!res.ok) rollback/refetch
  };

  const updateUserRole = async (userId: string, newRole: User["role"]) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    // TODO: conectar a PATCH role
  };

  const getStatusColor = (status: User["status"]) =>
    status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

  const getRoleColor = (role: User["role"]) =>
    role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";

  const formatDate = (value: string | null, mode: "date" | "datetime" = "date") => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return mode === "date" ? d.toLocaleDateString() : d.toLocaleString();
  };

  if (loadingUsers) {
    return <div className="p-6 text-gray-600">Cargando usuarios...</div>;
  }

  const isUserOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false;
    const last = new Date(lastSeenAt).getTime();
    const now = Date.now();
    return now - last <= 12 * 60 * 1000; // 12 minutos
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium">
          + Agregar Usuario
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LISTA */}
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedUserId === user.id ? "ring-2 ring-green-500" : ""
              }`}
              onClick={() => setSelectedUserId(user.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{user.name ?? "—"}</h3>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  {/* <span className={`px-2 py-1 rounded text-xs font-medium ${isUserOnline(selectedUser.lastSeen) ? "Activo" : "Inactivo"}`}> 
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span> */}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Último login: {formatDate(user.lastLogin, "date")}</p>
                  <p>
                    Tareas: {user.tasksCompleted}/{user.tasksAssigned}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${user.tasksAssigned > 0 ? (user.tasksCompleted / user.tasksAssigned) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs">
                    {user.tasksAssigned > 0 ? Math.round((user.tasksCompleted / user.tasksAssigned) * 100) : 0}%
                    completado
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          {selectedUserId ? (
            selectedUser ? (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-semibold">Detalles del Usuario</h3>
                  <div className="flex gap-2">
                    {/* <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span> */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {isUserOnline(selectedUser.lastSeen) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-gray-900">{selectedUser.name ?? "—"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                  </div>

                  {/* <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol</label>
                      <select
                        value={selectedUser.role}
                        onChange={(e) => updateUserRole(selectedUser.id, e.target.value as User["role"])}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <select
                        value={selectedUser.status}
                        onChange={(e) => updateUserStatus(selectedUser.id, e.target.value as User["status"])}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Tareas Asignadas:</strong> {selectedUser.tasksAssigned}
                      </p>
                      <p>
                        <strong>Completadas:</strong> {selectedUser.tasksCompleted}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Último Login:</strong>
                      </p>
                      <p>{formatDate(selectedUser.lastLogin, "datetime")}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                      Asignar Tareas
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">
                      Ver Reporte
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600">No se pudo cargar el usuario.</div>
            )
          ) : (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">👥</span>
              <p>Selecciona un usuario para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
