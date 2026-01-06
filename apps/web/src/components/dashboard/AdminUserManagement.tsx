// components/dashboard/AdminUserManagement.tsx
"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  lastLogin: string;
  tasksAssigned: number;
  tasksCompleted: number;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Juan Pérez",
      email: "juan@empresa.com",
      role: "user",
      status: "active",
      lastLogin: "2024-01-20 09:30:00",
      tasksAssigned: 8,
      tasksCompleted: 5,
    },
    {
      id: "2",
      name: "María García",
      email: "maria@empresa.com",
      role: "user",
      status: "active",
      lastLogin: "2024-01-20 08:15:00",
      tasksAssigned: 12,
      tasksCompleted: 10,
    },
    {
      id: "3",
      name: "Carlos López",
      email: "carlos@empresa.com",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-20 10:00:00",
      tasksAssigned: 0,
      tasksCompleted: 0,
    },
    {
      id: "4",
      name: "Ana Martínez",
      email: "ana@empresa.com",
      role: "user",
      status: "inactive",
      lastLogin: "2024-01-15 14:20:00",
      tasksAssigned: 5,
      tasksCompleted: 3,
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const updateUserStatus = (userId: string, newStatus: User["status"]) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const updateUserRole = (userId: string, newRole: User["role"]) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const getStatusColor = (status: User["status"]) => {
    return status === "active" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role: User["role"]) => {
    return role === "admin" 
      ? "bg-purple-100 text-purple-800" 
      : "bg-blue-100 text-blue-800";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium">
          + Agregar Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Usuarios */}
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedUser?.id === user.id ? "ring-2 ring-green-500" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
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
                  <p>Último login: {new Date(user.lastLogin).toLocaleDateString()}</p>
                  <p>Tareas: {user.tasksCompleted}/{user.tasksAssigned}</p>
                </div>
                <div className="text-right">
                  <div className="bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${user.tasksAssigned > 0 ? (user.tasksCompleted / user.tasksAssigned) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs">
                    {user.tasksAssigned > 0 
                      ? Math.round((user.tasksCompleted / user.tasksAssigned) * 100) 
                      : 0
                    }% completado
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detalles del Usuario */}
        <div className="bg-gray-50 rounded-lg p-6">
          {selectedUser ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-semibold">Detalles del Usuario</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="mt-1 text-gray-900">{selectedUser.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Tareas Asignadas:</strong> {selectedUser.tasksAssigned}</p>
                    <p><strong>Completadas:</strong> {selectedUser.tasksCompleted}</p>
                  </div>
                  <div>
                    <p><strong>Último Login:</strong></p>
                    <p>{new Date(selectedUser.lastLogin).toLocaleString()}</p>
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