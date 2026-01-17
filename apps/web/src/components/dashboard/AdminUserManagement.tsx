"use client";

import { useEffect, useMemo, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: string | null;
  tasksAssigned: number;
  tasksCompleted: number;
}

type UserDetail = User & {
  // tasks?: any[];
  // evaluations?: any[];
  // workSessions?: any[];
  // productivity?: any;
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
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

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserDetail(null);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setError(null);
        setLoadingDetail(true);

        const res = await fetch(`/api/admin/users?id=${encodeURIComponent(selectedUserId)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Error cargando detalle");
        }

        const detail: UserDetail = await res.json();
        if (!alive) return;

        const fallback = users.find((u) => u.id === selectedUserId);
        const merged: UserDetail = {
          ...fallback,
          ...detail,
          id: selectedUserId,
          name: detail.name ?? fallback?.name ?? null,
          email: detail.email ?? fallback?.email ?? "",
          role: (detail.role ?? fallback?.role ?? "user") as User["role"],
          status: (detail.status ?? fallback?.status ?? "active") as User["status"],
          lastLogin: detail.lastLogin ?? fallback?.lastLogin ?? null,
          tasksAssigned: detail.tasksAssigned ?? fallback?.tasksAssigned ?? 0,
          tasksCompleted: detail.tasksCompleted ?? fallback?.tasksCompleted ?? 0,
        };

        setSelectedUserDetail(merged);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error");
        setSelectedUserDetail(null);
      } finally {
        if (alive) setLoadingDetail(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedUserId, users]);

  const selectedUserFromList = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => u.id === selectedUserId) ?? null;
  }, [users, selectedUserId]);

  const updateUserStatus = async (userId: string, newStatus: User["status"]) => {
    // optimistic list
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    // optimistic detail
    setSelectedUserDetail((prev) => (prev?.id === userId ? { ...prev, status: newStatus } : prev));

    // TODO: cuando tenga el endpoint PATCH:
    // const res = await fetch(`/api/admin/users/${userId}/status`, {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ status: newStatus }),
    // });
    // if (!res.ok) { ...rollback o refetch... }
  };

  const updateUserRole = async (userId: string, newRole: User["role"]) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setSelectedUserDetail((prev) => (prev?.id === userId ? { ...prev, role: newRole } : prev));

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
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
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
                        width: `${
                          user.tasksAssigned > 0 ? (user.tasksCompleted / user.tasksAssigned) * 100 : 0
                        }%`,
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
            loadingDetail ? (
              <div className="text-gray-600">Cargando detalle...</div>
            ) : selectedUserDetail || selectedUserFromList ? (
              (() => {
                const u = selectedUserDetail ?? selectedUserFromList!;
                return (
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg font-semibold">Detalles del Usuario</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(u.status)}`}>
                          {u.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <p className="mt-1 text-gray-900">{u.name ?? "—"}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-gray-900">{u.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rol</label>
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as User["role"])}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estado</label>
                          <select
                            value={u.status}
                            onChange={(e) => updateUserStatus(u.id, e.target.value as User["status"])}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Tareas Asignadas:</strong> {u.tasksAssigned}
                          </p>
                          <p>
                            <strong>Completadas:</strong> {u.tasksCompleted}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Último Login:</strong>
                          </p>
                          <p>{formatDate(u.lastLogin, "datetime")}</p>
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
                );
              })()
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
