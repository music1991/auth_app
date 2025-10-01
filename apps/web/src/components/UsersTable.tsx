"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
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
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
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
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success("User verified.");
      setUsers((prev) => (prev ?? []).map((u) => (u.id === id ? { ...u, verified: true } : u)));
    } catch (e: any) {
      toast.error(e.message || "Could not verify user.");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/users/${id}/delete`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success("User deleted.");
      setUsers((prev) => (prev ?? []).filter((u) => u.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Could not delete user.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="rounded border p-6 text-sm text-muted-foreground">Loading users…</div>;
  }

  if (!users || users.length === 0) {
    return <div className="rounded border p-6 text-sm text-muted-foreground">No users found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="px-3 py-2 text-left">Verified</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.name ?? "—"}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 font-medium">{u.role}</td>
                <td className="px-3 py-2">
                  {u.verified ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {!u.verified && (
                      <button
                        onClick={() => verify(u.id)}
                        disabled={busyId === u.id}
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        {busyId === u.id ? "Verifying…" : "Verify"}
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        onClick={() => removeUser(u.id)}
                        disabled={busyId === u.id}
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {busyId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">This is you</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
