"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar, CheckCircle, Loader2, Mail,
  Shield, Trash2, User, XCircle,
} from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  role: "admin" | "user";
  verified: boolean;
  createdAt: string;
};

export default function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch {
      toast.error("No se pudieron cargar los usuarios.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    try {
      setBusyId(id);
      const res = await fetch(`/api/users/${id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al verificar");
      toast.success("Usuario verificado");
      setUsers((prev) => (prev ?? []).map((u) => (u.id === id ? { ...u, verified: true } : u)));
    } catch (e: any) {
      toast.error(e.message || "No se pudo verificar");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/users/${id}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al eliminar");
      toast.success("Usuario eliminado");
      setUsers((prev) => (prev ?? []).filter((u) => u.id !== id));
    } catch (e: any) {
      toast.error(e.message || "No se pudo eliminar");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
        <p className="text-sm text-gray-500">Cargando usuarios…</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <User className="w-14 h-14 text-gray-300" />
        <p className="text-sm text-gray-500">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Usuario", "Rol", "Estado", "Creado", "Acciones"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const displayName =
                [u.name, u.lastName].filter(Boolean).join(" ") || u.email;

              return (
                <tr
                  key={u.id}
                  className="transition-colors duration-150 hover:bg-gray-50/60"
                >
                  {/* Usuario */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-4 h-4 shrink-0 ${
                          u.role === "admin" ? "text-green-600" : "text-gray-300"
                        }`}
                      />
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          u.role === "admin"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    {u.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <XCircle className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* Creado */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 shrink-0" />
                      {new Date(u.createdAt).toLocaleDateString("es-AR")}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!u.verified && (
                        <button
                          onClick={() => verify(u.id)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium transition-all hover:bg-green-700 hover:shadow-sm disabled:opacity-50"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {busyId === u.id ? "Verificando…" : "Verificar"}
                        </button>
                      )}

                      {!isSelf && (
                        <button
                          onClick={() => removeUser(u.id)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium transition-all hover:bg-red-600 hover:shadow-sm disabled:opacity-50"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          {busyId === u.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      )}

                      {isSelf && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Tú
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
