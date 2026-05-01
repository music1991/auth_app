"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string;
  role: "admin" | "user";
  verified: boolean;
  createdAt: string;
};

export default function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", { 
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data: User[] = await res.json();
      setUsers(data);
    } catch {
      toast.error("Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (id: string) => {
    try {
      setBusyId(id);
      const res = await fetch(`/api/users/${id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to verify user");
      toast.success("User verified successfully");
      setUsers((prev) => (prev ?? []).map((u) => (u.id === id ? { ...u, verified: true } : u)));
    } catch (e: any) {
      toast.error(e.message || "Could not verify user");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/users/${id}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete user");
      toast.success("User deleted successfully");
      setUsers((prev) => (prev ?? []).filter((u) => u.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Could not delete user");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-lg opacity-20 animate-pulse rounded-full" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">Loading users</p>
          <p className="text-sm text-gray-500">Fetching user data...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="w-16 h-16 text-gray-400" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">No users found</p>
          <p className="text-sm text-gray-500">There are no registered users yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const displayName = [u.name, u.lastName].filter(Boolean).join(" ") || u.email;
              
              return (
                <tr 
                  key={u.id} 
                  className="transition-colors duration-150 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${
                        u.role === "admin" ? "text-purple-600" : "text-gray-400"
                      }`} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        u.role === "admin" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {u.verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <XCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!u.verified && (
                        <button
                          onClick={() => verify(u.id)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {busyId === u.id ? "Verifying..." : "Verify"}
                        </button>
                      )}

                      {!isSelf && (
                        <button
                          onClick={() => removeUser(u.id)}
                          disabled={busyId === u.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          {busyId === u.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                      
                      {isSelf && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          You
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